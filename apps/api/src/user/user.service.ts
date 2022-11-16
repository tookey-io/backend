import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { UserRepository, UserTelegramRepository } from '@tookey/database';

import {
  CreateTelegramUserDto,
  TelegramUserDto,
  TelegramUserRequestDto,
  UpdateTelegramUserDto,
} from './user-telegram.dto';
import { CreateUserDto, UpdateUserDto, UserDto, UserRequestDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
    private readonly dataSource: DataSource,
    private readonly users: UserRepository,
    private readonly telegramUsers: UserTelegramRepository,
  ) {}

  async getUser(dto: UserRequestDto): Promise<UserDto | null> {
    const user = await this.users.findOne({ where: dto });
    if (!user) return null;
    return new UserDto(user);
  }

  async createUser(dto: CreateUserDto): Promise<UserDto> {
    const parent = await this.users.findRoot();
    const user = await this.users.createOrUpdateOne({ ...dto, parent });
    return new UserDto(user);
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

    try {
      const parent = await this.users.findRoot();
      const user = await this.users.createOrUpdateOne({ parent }, entityManager);
      const userTelegram = await this.telegramUsers.createOrUpdateOne({ ...dto, userId: user.id }, entityManager);

      await queryRunner.commitTransaction();

      return new TelegramUserDto({ ...userTelegram, user: new UserDto(user) });
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Telegram User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }

  async updateUserTelegram(id: number, dto: UpdateTelegramUserDto, relations?: ['user']): Promise<TelegramUserDto> {
    const telegramUser = await this.telegramUsers.createOrUpdateOne({ ...dto, id });
    if (!telegramUser) return null;
    return this.getTelegramUser({ id: telegramUser.id }, relations);
  }
}
