import { differenceInSeconds } from 'date-fns';
import { Context } from 'telegraf';
import { DataSource } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { UserRepository, UserTelegramRepository } from '@tookey/database';

import { TelegrafMiddleware, TookeyContext } from '../bot.types';

@Injectable()
export class TelegramUserMiddleware implements TelegrafMiddleware {
  private readonly logger = new Logger(TelegramUserMiddleware.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly users: UserRepository,
    private readonly telegramUsers: UserTelegramRepository,
  ) {}

  async use(ctx: TookeyContext, next: () => Promise<void>) {
    const telegramId = this.getTelegramId(ctx);
    const userTelegram = await this.telegramUsers.findOneBy({ telegramId });

    if (userTelegram) {
      this.logger.debug('telegram user exists');

      ctx.user = userTelegram;

      const { user } = userTelegram;
      if (differenceInSeconds(user.lastInteraction, new Date()) > 10) {
        user.fresh = true;
      }
      user.lastInteraction = new Date();
      this.users.createOrUpdateOne(user);
    } else {
      this.logger.debug('new telegram user');

      const queryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const entityManager = queryRunner.manager;

      try {
        const parent = await this.users.findRoot();
        const user = await this.users.createOrUpdateOne(
          { parent },
          entityManager,
        );
        const userTelegram = await this.telegramUsers.createOrUpdateOne(
          {
            telegramId,
            chatId: ctx.chat.id,
            user,
          },
          entityManager,
        );

        await queryRunner.commitTransaction();

        ctx.user = userTelegram;
      } catch (error) {
        queryRunner.isTransactionActive &&
          (await queryRunner.rollbackTransaction());
        this.logger.error('new telegram user transaction', error);
      } finally {
        await queryRunner.release();
      }
    }

    await next();
  }

  getTelegramId(ctx: Context): number {
    let telegramId = 0;
    if ('callback_query' in ctx.update) {
      telegramId = ctx.update.callback_query.from.id;
    } else if ('message' in ctx.update) {
      telegramId = ctx.update.message.from.id;
    } else if ('my_chat_member' in ctx.update) {
      telegramId = ctx.update.my_chat_member.from.id;
    }

    if (telegramId > 0) return telegramId;

    throw new Error('Can not find user id');
  }
}
