import { differenceInSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Context } from 'telegraf';
import * as tg from 'telegraf/types';
import { DataSource } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { UserRepository, UserTelegram, UserTelegramRepository } from '@tookey/database';

import { TelegrafMiddleware, TookeyContext } from '../bot.types';

@Injectable()
export class TelegramUserMiddleware implements TelegrafMiddleware {
  constructor(
    @InjectPinoLogger(TelegramUserMiddleware.name) private readonly logger: PinoLogger,
    private readonly dataSource: DataSource,
    private readonly users: UserRepository,
    private readonly telegramUsers: UserTelegramRepository,
  ) {}

  async use(ctx: TookeyContext, next: () => Promise<void>) {
    const sender = this.getSender(ctx);
    const userTelegram = await this.telegramUsers.findOne({
      where: { telegramId: sender.id },
      relations: { user: true },
    });

    if (userTelegram) {
      ctx.user = userTelegram;
      const { user } = userTelegram;

      if (differenceInSeconds(user.lastInteraction, new Date()) > 10) user.fresh = true;
      user.lastInteraction = new Date();

      this.users.createOrUpdateOne(user);

      if (this.isProfileUpdated(userTelegram, sender)) {
        this.telegramUsers.createOrUpdateOne({
          id: userTelegram.id,
          userId: user.id,
          telegramId: sender.id,
          chatId: ctx.chat.id,
          firstName: sender.first_name,
          lastName: sender.last_name,
          username: sender.username,
          languageCode: sender.language_code,
        });
      }
    } else {
      this.logger.info('New Telegram User');

      const queryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const entityManager = queryRunner.manager;

      try {
        const parent = await this.users.findRoot();
        const user = await this.users.createOrUpdateOne({ parent }, entityManager);
        const userTelegram = await this.telegramUsers.createOrUpdateOne(
          {
            userId: user.id,
            telegramId: sender.id,
            chatId: ctx.chat.id,
            firstName: sender.first_name,
            lastName: sender.last_name,
            username: sender.username,
            languageCode: sender.language_code,
          },
          entityManager,
        );

        await queryRunner.commitTransaction();

        ctx.user = userTelegram;
      } catch (error) {
        queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
        this.logger.error('Create Telegram User transaction', error);
      } finally {
        await queryRunner.release();
      }
    }

    await next();
  }

  private getSender(ctx: Context): tg.User {
    let sender: tg.User;
    if ('callback_query' in ctx.update) {
      sender = ctx.update.callback_query.from;
    } else if ('message' in ctx.update) {
      sender = ctx.update.message.from;
    } else if ('inline_query' in ctx.update) {
      sender = ctx.update.inline_query.from;
    } else if ('my_chat_member' in ctx.update) {
      sender = ctx.update.my_chat_member.from;
    }

    if (sender) return sender;

    throw new Error("Can't find sender");
  }

  private isProfileUpdated(telegramUser: UserTelegram, sender: tg.User): boolean {
    const { username, lastName, firstName } = telegramUser;
    if (
      (sender.username && sender.username !== username) ||
      (sender.last_name && sender.last_name !== lastName) ||
      (sender.last_name && sender.last_name !== firstName)
    ) {
      return true;
    }
    return false;
  }
}
