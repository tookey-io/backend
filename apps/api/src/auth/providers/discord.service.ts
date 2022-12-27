import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { UserDiscordRepository } from '@tookey/database';

import { UserDto } from '../../user/user.dto';
import { UserService } from '../../user/user.service';
import { CreateDiscordUserDto, DiscordUserDto, DiscordUserRequestDto, UpdateDiscordUserDto } from './discord.dto';

@Injectable()
export class DiscordService {
  constructor(
    @InjectPinoLogger(DiscordService.name) private readonly logger: PinoLogger,
    private readonly dataSource: DataSource,
    private readonly discordUsers: UserDiscordRepository,
    private readonly userService: UserService,
  ) {}

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

      return new DiscordUserDto({ ...userDiscord });
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create Discord User transaction', error);
    } finally {
      await queryRunner.release();
    }
  }
}