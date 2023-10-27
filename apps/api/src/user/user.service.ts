import * as bcrypt from 'bcrypt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, EntityManager, FindOneOptions } from 'typeorm';

import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  User,
  UserDiscordRepository,
  UserGoogle,
  UserGoogleRepository,
  UserRepository,
  UserTelegramRepository,
  UserTwitterRepository,
} from '@tookey/database';

import {
  CreateTelegramUserDto,
  TelegramUserDto,
  TelegramUserRequestDto,
  UpdateTelegramUserDto,
} from './user-telegram.dto';
import { CreateUserDto, UpdateUserDto, UserContextDto, UserDto, UserRequestDto } from './user.dto';
import { CreateDiscordUserDto, CreateGoogleUserDto, GoogleUserDto } from './user-google.dto';
import { CreateTwitterUserDto } from './user-twitter.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
    private readonly dataSource: DataSource,
    private readonly users: UserRepository,
    private readonly telegramUsers: UserTelegramRepository,
    private readonly googleUsers: UserGoogleRepository,
    private readonly discordUsers: UserDiscordRepository,
    private readonly twitterUsers: UserTwitterRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getUser(dto: UserRequestDto, overrides?: FindOneOptions<User>): Promise<User | null> {
    const user = await this.users.findOne({ where: dto, ...overrides });
    if (!user) return null;
    return user;
  }

  async createUser(dto: Partial<User>, entityManager?: EntityManager) {
    dto.parent = dto.parent || (await this.users.findRoot());
    const user = await this.users.createOrUpdateOne(dto, entityManager);
    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<UserDto | null> {
    const user = await this.users.createOrUpdateOne({ ...dto, id });
    if (!user) return null;
    return new UserDto(user);
  }

  async getTelegramUser(dto: TelegramUserRequestDto, relations?: ['user']): Promise<TelegramUserDto | null> {
    const userTelegram = await this.telegramUsers.findOne({ where: dto, relations });
    if (!userTelegram) return null;

    if (userTelegram.user) {
      return new TelegramUserDto({ ...userTelegram, user: new UserDto(userTelegram.user) });
    }

    return new TelegramUserDto({ ...userTelegram, user: undefined });
  }

  async createTelegramUser(dto: CreateTelegramUserDto): Promise<TelegramUserDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    const userDto = {} as Partial<User>
    if (dto.invitedBy) {
      userDto.parent = await this.getParentUser(dto.invitedBy);
    }

    try {
      const user = await this.createUser(userDto, entityManager);
      const userTelegram = await this.telegramUsers.createOrUpdateOne({ ...dto, userId: user.id }, entityManager);

      await queryRunner.commitTransaction();

      return new TelegramUserDto({ ...userTelegram, user });
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Telegram User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }


  async createTwitterUser(dto: CreateTwitterUserDto, userDto: Partial<User> = {}) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const user = await this.createUser(userDto, entityManager);
      const userDiscord = await this.twitterUsers.createOrUpdateOne(
        {
          user,
          twitterId: dto.id,
          username: dto.username,
          name: dto.name,
          accessToken: dto.accessToken,
          validUntil: dto.validUntil,
          refreshToken: dto.refreshToken,
        },
        entityManager,
      );

      await queryRunner.commitTransaction();

      return userDiscord
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Twitter User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }

  async getOrCreateTwitterUser(dto: CreateTwitterUserDto) {
    const userDiscord = await this.twitterUsers.findOne({ where: { twitterId: dto.id }, relations: ['user'] });
    console.log('found?', userDiscord);
    if (userDiscord) return userDiscord;

    return this.createTwitterUser(dto);
  }

  async getOrConnectTwitterUser(dto: CreateTwitterUserDto, user: UserContextDto) {
    const found = await this.discordUsers.findOne({ where: { discordId: dto.id }, relations: ['user'] });

    if (found && user.id !== found.user.id) {
      throw new BadRequestException("This twitter account is already connected to another user");
    }

    if (found) return found;

    return this.createTwitterUser(dto, { id: user.id });
  }

  async createDiscordUser(dto: CreateDiscordUserDto, userDto: Partial<User> = {}) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const user = await this.createUser(userDto, entityManager);
      const userDiscord = await this.discordUsers.createOrUpdateOne(
        {
          user,
          discordId: dto.id,
          discordTag: `${dto.username}#${dto.discriminator}`,
          email: dto.email,
          verified: dto.verified,
          accessToken: dto.accessToken,
          validUntil: dto.validUntil,
          refreshToken: dto.refreshToken,
        },
        entityManager,
      );

      await queryRunner.commitTransaction();

      return userDiscord
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Discord User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }

  async getOrCreateDiscordUser(dto: CreateDiscordUserDto) {
    const userDiscord = await this.discordUsers.findOne({ where: { discordId: dto.id }, relations: ['user'] });
    console.log('found?', userDiscord);
    if (userDiscord) return userDiscord;

    return this.createDiscordUser(dto);
  }

  async getOrConnectDiscordUser(dto: CreateDiscordUserDto, user: UserContextDto) {
    const found = await this.discordUsers.findOne({ where: { discordId: dto.id }, relations: ['user'] });

    if (found && user.id !== found.user.id) {
      throw new BadRequestException("This discord account is already connected to another user");
    }

    if (found) return found;

    return this.createDiscordUser(dto, { id: user.id });
  }

  async createGoogleUser(dto: CreateGoogleUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const user = await this.createUser({}, entityManager);
      const userGoogle = await this.googleUsers.createOrUpdateOne({ ...dto, userId: user.id }, entityManager);

      await queryRunner.commitTransaction();

      return userGoogle
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Google User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }

  async getOrCreateGoogleUser(dto: CreateGoogleUserDto): Promise<UserGoogle> {
    const userGoogle = await this.googleUsers.findOne({ where: { googleId: dto.googleId }, relations: ['user'] });
    if (userGoogle) return userGoogle;

    return this.createGoogleUser(dto);
  }

  async getParentUser(username?: string): Promise<User> {
    if (!username) return await this.users.findRoot();
    const userTelegram = await this.telegramUsers.findOne({ where: { username }, relations: { user: true } });
    if (!userTelegram) return await this.users.findRoot();
    return userTelegram.user;
  }

  async updateUserTelegram(id: number, dto: UpdateTelegramUserDto, relations?: ['user']): Promise<TelegramUserDto> {
    const telegramUser = await this.telegramUsers.createOrUpdateOne({ ...dto, id });
    if (!telegramUser) return null;
    return this.getTelegramUser({ id: telegramUser.id }, relations);
  }

  async setCurrentRefreshToken(token: string, userId: number) {
    const refreshToken = await bcrypt.hash(token, 10);
    await this.users.createOrUpdateOne({ id: userId, refreshToken });
  }

  async removeRefreshToken(userId: number) {
    return this.users.createOrUpdateOne({
      id: userId,
      refreshToken: null,
    });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    this.logger.info({ refreshToken });
    const user = await this.users.findOneBy({ id: userId });
    if (!user) return null;

    this.logger.info({ user });
    const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.refreshToken);
    if (isRefreshTokenMatching) return new UserDto(user);
  }

  getAllUsers(): Promise<User[]> {
    return this.users.find({ relations: ['parent'] });
  }
}
