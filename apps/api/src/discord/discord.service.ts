import { UserEvent } from 'apps/api/src/api.events';
import { UserDto } from 'apps/api/src/user/user.dto';
import { UserService } from 'apps/api/src/user/user.service';
import { AppConfiguration } from 'apps/app/src/app.config';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDiscordRepository } from '@tookey/database';

import {
  CreateDiscordUserDto,
  DiscordAccessTokenRequestDto,
  DiscordAuthUrlResponseDto,
  DiscordGuildMembershipResponseDto,
  DiscordTokenExchangeDto,
  DiscordUserDto,
  DiscordUserRequestDto,
  UpdateDiscordUserDto,
} from './discord.dto';

@Injectable()
export class DiscordService {
  discordApiUrl = 'https://discord.com/api';

  constructor(
    @InjectPinoLogger(DiscordService.name) private readonly logger: PinoLogger,
    private readonly dataSource: DataSource,
    private readonly discordUsers: UserDiscordRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  async getAuthLink(): Promise<DiscordAuthUrlResponseDto> {
    const scope = ['identify', 'email', 'guilds.members.read'];
    const discord = this.configService.get('discord', { infer: true });
    const oAuth2Url = `${this.discordApiUrl}/oauth2/authorize`;
    const params = new URLSearchParams({
      client_id: discord.clientID,
      redirect_uri: discord.callbackURL,
      response_type: 'code',
      scope: scope.join(' '),
    });
    const url = `${oAuth2Url}?${params.toString()}`;
    return { url };
  }

  private async exchangeTokens(code: string): Promise<DiscordTokenExchangeDto> {
    try {
      const { clientID, clientSecret, callbackURL } = this.configService.get('discord', { infer: true });
      const response = await fetch(`${this.discordApiUrl}/oauth2/token`, {
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

      const data = await response.json();

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
        scope: data.scope,
        tokenType: data.token_type,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async requestUser({ code }: DiscordAccessTokenRequestDto): Promise<DiscordUserDto> {
    try {
      const oauthData = await this.exchangeTokens(code);
      const authorization = `Bearer ${oauthData.accessToken}`;

      const response = await fetch(`${this.discordApiUrl}/users/@me`, {
        headers: { authorization },
      });

      const userData = await response.json();
      const discordUser = await this.getUser({ discordId: userData.id }, null);
      const discordTag = `${userData.username}#${userData.discriminator}`;

      const validUntil = oauthData.expiresIn ? addSeconds(new Date(), oauthData.expiresIn * 1000) : null;

      if (!discordUser) {
        return await this.createDiscordUser({
          discordId: userData.id,
          discordTag,
          email: userData.email,
          avatar: userData.avatar,
          locale: userData.locale,
          verified: userData.verified,
          accessToken: oauthData.accessToken,
          refreshToken: oauthData.refreshToken,
          validUntil,
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
            accessToken: oauthData.accessToken,
            refreshToken: oauthData.refreshToken,
          },
          null,
        );
      }
    } catch (error) {
      throw new ForbiddenException('Invalid verifier or access tokens!');
    }
  }

  async checkGuildMembership(userId: number, guildId: string): Promise<DiscordGuildMembershipResponseDto> {
    const user = await this.getUser({ userId }, null);
    const authorization = `Bearer ${user.accessToken}`;
    const result = await fetch(`${this.discordApiUrl}/users/@me/guilds/${guildId}/member`, {
      headers: { authorization },
    });

    const data = await result.json();

    return { isMember: !!data.joined_at };
  }

  async getUser(dto: DiscordUserRequestDto, relations?: ['user']): Promise<DiscordUserDto | null> {
    let userDiscord = await this.discordUsers.findOne({ where: dto, relations });
    if (!userDiscord) return null;

    if (userDiscord.validUntil < new Date()) {
      await this.refreshTokenByUserId(userDiscord.id);
      userDiscord = await this.discordUsers.findOne({ where: dto, relations });
    }

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

  async refreshTokenByUserId(id: number): Promise<void> {
    const user = await this.discordUsers.findOne({ where: { id } });
    try {
      const { clientID, clientSecret } = this.configService.get('discord', { infer: true });
      const response = await fetch(`${this.discordApiUrl}/oauth2/token/revoke`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientID,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();
      const validUntil = data.expires_in ? addSeconds(new Date(), data.expires_in * 1000) : null;
      await this.updateUser(
        user.id,
        { accessToken: data.access_token, refreshToken: data.refresh_token, validUntil },
        null,
      );
    } catch (error) {}
  }
}
