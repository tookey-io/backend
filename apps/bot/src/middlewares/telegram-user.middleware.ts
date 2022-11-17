import { TelegramUserDto } from 'apps/api/src/user/user-telegram.dto';
import { UserService } from 'apps/api/src/user/user.service';
import { differenceInSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Context } from 'telegraf';
import * as tg from 'telegraf/types';

import { Injectable } from '@nestjs/common';

import { TelegrafMiddleware, TookeyContext } from '../bot.types';

@Injectable()
export class TelegramUserMiddleware implements TelegrafMiddleware {
  constructor(
    @InjectPinoLogger(TelegramUserMiddleware.name) private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {}

  async use(ctx: TookeyContext, next: () => Promise<void>) {
    const sender = this.getSender(ctx);
    const userTelegram = await this.userService.getTelegramUser({ telegramId: sender.id }, ['user']);

    if (userTelegram) {
      ctx.user = userTelegram;
      const { user } = userTelegram;

      this.userService.updateUser(user.id, {
        lastInteraction: new Date(),
        fresh: differenceInSeconds(new Date(user.lastInteraction), new Date()) > 10,
      });

      if (this.isProfileUpdated(userTelegram, sender)) {
        this.userService.updateUserTelegram(userTelegram.id, {
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

      const userTelegram = await this.userService.createTelegramUser({
        telegramId: sender.id,
        chatId: ctx.chat.id,
        firstName: sender.first_name,
        lastName: sender.last_name,
        username: sender.username,
        languageCode: sender.language_code,
        invitedBy: this.getInvitedBy(ctx),
      });

      ctx.user = userTelegram;
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

  private getInvitedBy(ctx: TookeyContext): string {
    if (ctx.startPayload) {
      const encoded = Buffer.from(ctx.startPayload, 'base64').toString('ascii').split('=');
      if (encoded[0] === 'invite' && encoded[1]) return encoded[1];
    }
    return '';
  }

  private isProfileUpdated(telegramUser: TelegramUserDto, sender: tg.User): boolean {
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
