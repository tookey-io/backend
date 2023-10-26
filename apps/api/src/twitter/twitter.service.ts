import { AppConfiguration } from 'apps/app/src/app.config';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { IOAuth2RequestTokenResult, TwitterApi } from 'twitter-api-v2';
import { DataSource } from 'typeorm';

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterSession, TwitterSessionRepository, UserTwitterRepository } from '@tookey/database';

import { UserDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import {
  CreateTweetDto,
  CreateTwitterUserDto,
  TwitterAccessTokenRequestDto,
  TwitterUserDto,
  TwitterUserRequestDto,
  UpdateTwitterUserDto,
} from './twitter.dto';

@Injectable()
export class TwitterService {
  client: TwitterApi;

  constructor(
    @InjectPinoLogger(TwitterService.name) private readonly logger: PinoLogger,
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly dataSource: DataSource,
    private readonly twitterUsers: UserTwitterRepository,
    private readonly twitterSession: TwitterSessionRepository,
    private readonly userService: UserService,
  ) {
    const { clientId, clientSecret } = configService.get('twitter', { infer: true });
    this.client = new TwitterApi({ clientId, clientSecret });
  }

  async getAuthLink(): Promise<IOAuth2RequestTokenResult> {
    const { callbackUrl } = this.configService.get('twitter', { infer: true });
    return this.client.generateOAuth2AuthLink(callbackUrl, {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });
  }

  async requestUser({ code, codeVerifier }: TwitterAccessTokenRequestDto): Promise<TwitterUserDto> {
    const { callbackUrl } = this.configService.get('twitter', { infer: true });

    try {
      const result = await this.client.loginWithOAuth2({ code, codeVerifier, redirectUri: callbackUrl });
      const { client: loggedClient, accessToken, refreshToken, expiresIn } = result;

      const { data } = await loggedClient.v2.me();

      const { id: twitterId, name, username } = data;
      const twitterUser = await this.getUser({ twitterId }, null);

      const validUntil = expiresIn ? addSeconds(new Date(), expiresIn) : null;

      if (!twitterUser) {
        return await this.createTwitterUser({
          twitterId,
          name,
          username,
          accessToken,
          refreshToken,
          validUntil,
        });
      } else {
        return await this.updateUser(
          twitterUser.id,
          {
            name,
            username,
            accessToken,
            refreshToken,
            validUntil,
          },
          null,
        );
      }
    } catch (error) {
      throw new ForbiddenException('Invalid verifier or access tokens!');
    }
  }

  async getUser(dto: TwitterUserRequestDto, relations?: ['user']): Promise<TwitterUserDto | null> {
    let userTwitter = await this.twitterUsers.findOne({ where: dto, relations });
    if (!userTwitter) return null;

    if (userTwitter.validUntil < new Date()) {
      await this.refreshTokenByUserId(userTwitter.id);
      userTwitter = await this.twitterUsers.findOne({ where: dto, relations });
    }

    if (userTwitter.user) {
      return new TwitterUserDto({ ...userTwitter, user: new UserDto(userTwitter.user) });
    }

    return new TwitterUserDto(userTwitter);
  }

  async updateUser(id: number, dto: UpdateTwitterUserDto, relations?: ['user']): Promise<TwitterUserDto> {
    const twitterUser = await this.twitterUsers.createOrUpdateOne({ ...dto, id });
    if (!twitterUser) return null;
    return this.getUser({ id: twitterUser.id }, relations);
  }

  async createTwitterUser(dto: CreateTwitterUserDto): Promise<TwitterUserDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const user = await this.userService.createUser({}, entityManager);
      const userTwitter = await this.twitterUsers.createOrUpdateOne({ ...dto, userId: user.id }, entityManager);

      await queryRunner.commitTransaction();

      return new TwitterUserDto({ ...userTwitter });
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Twitter User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }

  async refreshTokenByUserId(id: number): Promise<void> {
    const user = await this.twitterUsers.findOne({ where: { id } });
    try {
      const { accessToken, refreshToken } = await this.client.refreshOAuth2Token(user.refreshToken);
      await this.updateUser(user.id, { accessToken, refreshToken }, null);
    } catch (error) {}
  }

  async tweet(userId: number, dto: CreateTweetDto): Promise<{ id: string; text: string }> {
    const user = await this.getUser({ userId });
    if (!user) throw new BadRequestException('User not found');

    const client = new TwitterApi(user.accessToken);

    const tweet = await client.v2.tweet(dto.tweet);
    return tweet.data;

    // TODO: save message id and check on game start
  }

  async saveSession(state: string, codeVerifier: string): Promise<TwitterSession> {
    return this.twitterSession.createOrUpdateOne({ state, codeVerifier });
  }

  async loadSession(state: string): Promise<TwitterSession | null> {
    const session = await this.twitterSession.findOneBy({ state });
    if (!session) return null;
    this.twitterSession.delete({ id: session.id });
    return session;
  }
}
