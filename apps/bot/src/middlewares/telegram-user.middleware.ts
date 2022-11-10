import { differenceInSeconds } from 'date-fns';
import { Context } from 'telegraf';

import { Injectable, Logger } from '@nestjs/common';
import { UserRepository, UserTelegramRepository } from '@tookey/database';

import { TelegrafMiddleware } from '../bot.types';

@Injectable()
export class TelegramUserMiddleware implements TelegrafMiddleware {
  private readonly logger = new Logger(TelegramUserMiddleware.name);

  constructor(
    private readonly users: UserRepository,
    private readonly telegramUsers: UserTelegramRepository,
  ) {}

  async use(ctx: Context, next: () => Promise<void>) {
    this.logger.debug(ctx.update);

    const telegramId = this.getTelegramId(ctx);
    const userTelegram = await this.telegramUsers.findOneBy({ telegramId });

    if (userTelegram) {
      this.logger.debug('telegram user exists');

      const { user } = userTelegram;

      if (differenceInSeconds(user.lastInteraction, new Date()) > 10) {
        user.fresh = true;
      }

      user.lastInteraction = new Date();

      // TODO: transaction
      await this.telegramUsers.createOrUpdateOne(userTelegram);
      await this.users.createOrUpdateOne(user);

      ctx.user = userTelegram;
    } else {
      this.logger.debug('new telegram user');

      // TODO: transaction
      const user = await this.users.createOrUpdateOne({});
      const userTelegram = await this.telegramUsers.createOrUpdateOne({
        telegramId,
        chatId: ctx.chat.id,
        user,
      });

      ctx.user = userTelegram;
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
