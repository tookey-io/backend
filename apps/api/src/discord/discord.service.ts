import { UserDto } from 'apps/api/src/user/user.dto';
import { UserService } from 'apps/api/src/user/user.service';
import { AppConfiguration } from 'apps/app/src/app.config';
import { Cache } from 'cache-manager';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';

import { HttpService } from '@nestjs/axios';
import { BadRequestException, CACHE_MANAGER, ForbiddenException, Inject, Injectable } from '@nestjs/common';
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

type GuildMembership = {
  nick: string;
  joined_at: string;
  roles: string[];
  pending: boolean;
  mute: boolean;
  deaf: boolean;
};

@Injectable()
export class DiscordService {
  discordApiUrl = 'https://discord.com/api';
  scope = ['identify', 'email', 'guilds.members.read'];

  codes = new Set<string>()

  constructor(
    @InjectPinoLogger(DiscordService.name) private readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly dataSource: DataSource,
    private readonly discordUsers: UserDiscordRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {
  }

  async getAuthLink(state?: string): Promise<DiscordAuthUrlResponseDto> {
    const discord = this.configService.get('discord', { infer: true });
    const oAuth2Url = `${this.discordApiUrl}/oauth2/authorize`;
    const params = new URLSearchParams({
      client_id: discord.clientID,
      redirect_uri: discord.callbackURL,
      response_type: 'code',
      scope: this.scope.join(' '),
    });
    if (state) params.set('state', state);
    const url = `${oAuth2Url}?${params.toString()}`;
    return { url };
  }

  private async exchangeTokens(code: string): Promise<DiscordTokenExchangeDto> {
    try {
      const { clientID, clientSecret, callbackURL } = this.configService.get('discord', { infer: true });
      console.log({
        clientID,
        clientSecret,
        callbackURL,
      })
      const { data } = await firstValueFrom(
        this.httpService.request({
          url: `${this.discordApiUrl}/oauth2/token`,
          method: 'POST',
          data: new URLSearchParams({
            client_id: clientID,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: callbackURL,
            // scope: 'identify email guilds.members.read'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip,deflate,compress',
          },
        }),
      ).catch(e => {
        console.error(e)
        throw e
      });

      if (data.error) throw new BadRequestException(data.error_description);

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
        scopes: data.scopes,
        tokenType: data.token_type,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async requestUser({ code }: DiscordAccessTokenRequestDto): Promise<DiscordUserDto> {
    if (this.codes.has(code)) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return null
    }
    
    this.codes.add(code)

    try {
      console.log('exchange tokens')
      const oauthData = await this.exchangeTokens(code);
      const authorization = `Bearer ${oauthData.accessToken}`;

      console.log('making call')

      const { data } = await firstValueFrom(
        this.httpService.request({
          url: `${this.discordApiUrl}/users/@me`,
          headers: {
            authorization,
            'Accept-Encoding': 'gzip,deflate,compress',
          },
        }),
      );

      console.log(data)

      const discordUser = await this.getUser({ discordId: data.id }, null);
      const discordTag = `${data.username}#${data.discriminator}`;

      const validUntil = oauthData.expiresIn ? addSeconds(new Date(), oauthData.expiresIn * 1000) : null;

      if (!discordUser) {
        return await this.createDiscordUser({
          discordId: data.id,
          discordTag,
          email: data.email,
          avatar: data.avatar,
          locale: data.locale,
          verified: data.verified,
          accessToken: oauthData.accessToken,
          refreshToken: oauthData.refreshToken,
          validUntil,
        });
      } else {
        return await this.updateUser(
          discordUser.id,
          {
            discordId: data.id,
            discordTag,
            email: data.email,
            avatar: data.avatar,
            locale: data.locale,
            verified: data.verified,
            accessToken: oauthData.accessToken,
            refreshToken: oauthData.refreshToken,
          },
          null,
        );
      }
    } catch (error) {
      throw new ForbiddenException(error);
    }
  }

  async checkGuildMembership(userId: number, guildId: string): Promise<DiscordGuildMembershipResponseDto> {
    const user = await this.getUser({ userId }, null);
    const authorization = `Bearer ${user.accessToken}`;

    const cacheKey = [user.accessToken, guildId, 'member'].join(':');
    const cacheTtl = 60;

    try {
      const data = await this.getCached(
        cacheKey,
        async () => {
          const { data } = await firstValueFrom(
            this.httpService.request<GuildMembership>({
              url: `${this.discordApiUrl}/users/@me/guilds/${guildId}/member`,
              headers: {
                authorization,
                'Accept-Encoding': 'gzip,deflate,compress',
              },
            }),
          );
          return data;
        },
        cacheTtl,
      );

      this.logger.debug('discord data', data);

      return {
        isMember: !!data.joined_at,
        username: data.nick?.replace(/[^a-zA-Z ]/g, '').slice(0, 20),
        // username: user.discordTag.split('#')[0].slice(0, 20),
        roles: data.roles,
      };
    } catch {
      return {
        isMember: false,
        username: 'Unnamed',
        roles: [],
      };
    }
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
    this.logger.debug('createDiscordUser');
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const user = await this.userService.createUser({}, entityManager);
      const userDiscord = await this.discordUsers.createOrUpdateOne({ ...dto, userId: user.id }, entityManager);

      await queryRunner.commitTransaction();

      const userDiscordDto = new DiscordUserDto({ ...userDiscord });
      // this.eventEmitter.emit(UserEvent.CREATE_DISCORD, userDiscordDto);
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

      const { data } = await firstValueFrom(
        this.httpService.request({
          url: `${this.discordApiUrl}/oauth2/token/revoke`,
          method: 'POST',
          data: new URLSearchParams({
            client_id: clientID,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: user.refreshToken,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip,deflate,compress',
          },
        }),
      );

      const validUntil = data.expires_in ? addSeconds(new Date(), data.expires_in * 1000) : null;
      await this.updateUser(
        user.id,
        { accessToken: data.access_token, refreshToken: data.refresh_token, validUntil },
        null,
      );
    } catch (error) {}
  }

  private async getCached<T>(cacheKey: string, fn: () => Promise<T> | T, ttl?: number): Promise<T> {
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) return cached;

    const cachedValue = await fn();

    if (ttl) this.cache.set(cacheKey, cachedValue, { ttl });
    else this.cache.set(cacheKey, cachedValue);
    return cachedValue;
  }
}
