import { UserEvent } from 'apps/api/src/api.events';
import { UserDto } from 'apps/api/src/user/user.dto';
import { UserService } from 'apps/api/src/user/user.service';
import { AppConfiguration } from 'apps/app/src/app.config';
import { randomUUID } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDiscordRepository } from '@tookey/database';

import { CreateDiscordUserDto, DiscordUserDto, DiscordUserRequestDto, UpdateDiscordUserDto } from './discord.dto';

@Injectable()
export class DiscordService {
  constructor(
    @InjectPinoLogger(DiscordService.name) private readonly logger: PinoLogger,
    private readonly dataSource: DataSource,
    private readonly discordUsers: UserDiscordRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  async getAuthLink(): Promise<any> {
    const scope = ['identify', 'email', 'guilds.members.read'];
    const discord = this.configService.get('discord', { infer: true });
    const oAuth2Url = 'https://discord.com/api/oauth2/authorize';
    const state = randomUUID();
    const params = new URLSearchParams({
      client_id: discord.clientID,
      redirect_uri: discord.callbackURL,
      response_type: 'code',
      state,
      scope: scope.join(' '),
    });
    const url = `${oAuth2Url}?${params.toString()}`;
    return { url, state };
  }

  async requestUser({ code, codeVerifier }: any): Promise<any> {
    try {
      const { clientID, clientSecret, callbackURL } = this.configService.get('discord', { infer: true });

      const tokenResponseData = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientID,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackURL,
          scope: 'identify',
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const oauthData = await tokenResponseData.json();
      console.log(oauthData);

      const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      const userData = await userResult.json();

      console.log(userData);

      const guildId = '1052191123092811816';
      const guildResult = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        },
      });

      const guildData = await guildResult.json();

      console.log(guildData);

      const discordUser = await this.getUser({ discordId: userData.id }, null);
      const discordTag = `${userData.username}#${userData.discriminator}`;

      // const validUntil = oauthData.expires_in ? addSeconds(new Date(), oauthData.expires_in) : null;

      if (!discordUser) {
        return await this.createDiscordUser({
          discordId: userData.id,
          discordTag,
          email: userData.email,
          avatar: userData.avatar,
          locale: userData.locale,
          verified: userData.verified,
          accessToken: oauthData.access_token,
          refreshToken: oauthData.refresh_token,
        });
      } else {
        return await this.updateUser(
          discordUser.id,
          {
            discordId: userData.id,
            discordTag,
            email: userData.email,
            avatar: userData.avatar,
            locale: userData.locale,
            verified: userData.verified,
            accessToken: oauthData.access_token,
            refreshToken: oauthData.refresh_token,
          },
          null,
        );
      }
    } catch (error) {
      throw new ForbiddenException('Invalid verifier or access tokens!');
    }
  }

  async getUser(dto: DiscordUserRequestDto, relations?: ['user']): Promise<DiscordUserDto | null> {
    const userDiscord = await this.discordUsers.findOne({ where: dto, relations });
    if (!userDiscord) return null;

    if (userDiscord.user) {
      return new DiscordUserDto({ ...userDiscord, user: new UserDto(userDiscord.user) });
    }

    return new DiscordUserDto(userDiscord);
  }

  async updateUser(id: number, dto: UpdateDiscordUserDto, relations?: ['user']): Promise<DiscordUserDto> {
    const discordUser = await this.discordUsers.createOrUpdateOne({ ...dto, id });
    if (!discordUser) return null;
    return this.getUser({ id: discordUser.id }, relations);
  }

  async createDiscordUser(dto: CreateDiscordUserDto): Promise<DiscordUserDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const user = await this.userService.createUser({ invitedBy: dto.invitedBy }, entityManager);
      const userDiscord = await this.discordUsers.createOrUpdateOne({ ...dto, userId: user.id }, entityManager);

      await queryRunner.commitTransaction();

      const userDiscordDto = new DiscordUserDto({ ...userDiscord });
      this.eventEmitter.emit(UserEvent.CREATE_DISCORD, userDiscordDto);
      return userDiscordDto;
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Discord User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }
}
