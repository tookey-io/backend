import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';

import { Injectable } from '@nestjs/common';
import { TelegramSessionRepository } from '@tookey/database';

import { TelegrafMiddleware, TookeyContext } from '../bot.types';

const EMPTY_SESSION: SceneContext['session'] = { __scenes: {} };

@Injectable()
export class TelegramSessionMiddleware implements TelegrafMiddleware {
  constructor(
    @InjectPinoLogger(TelegramSessionMiddleware.name) private readonly logger: PinoLogger,
    private readonly telegramSession: TelegramSessionRepository,
  ) {}

  async use(ctx: TookeyContext, next: () => Promise<void>): Promise<void> {
    const key = this.genSessionKey(ctx);
    if (!key) return next();

    let session: SceneContext['session'] = EMPTY_SESSION;

    Object.defineProperty(ctx, 'session', {
      get: function () {
        return session;
      },
      set: function (newValue) {
        session = Object.assign({}, newValue);
      },
    });

    const telegramSession = await this.getSession(key);

    session = telegramSession || EMPTY_SESSION;

    await next(); // wait all other middlewares
    await this.saveSession(key, session);
  }

  async getSession(id: string): Promise<SceneContext['session'] | undefined> {
    const telegramSession = await this.telegramSession.findOneBy({ id });
    if (!telegramSession) return;
    return telegramSession.session;
  }

  async saveSession(id: string, session: SceneContext['session']): Promise<void> {
    if (!session || Object.keys(session).length === 0) {
      await this.telegramSession.delete({ id });
      return;
    }
    await this.telegramSession.createOrUpdateOne({ id, session });
  }

  private genSessionKey(ctx: Context) {
    let fromId = 0;
    let chatId = 0;

    if ('callback_query' in ctx.update) {
      fromId = ctx.update.callback_query.from.id;
      chatId = ctx.update.callback_query.message.chat.id;
    } else if ('inline_query' in ctx.update) {
      fromId = ctx.update.inline_query.from.id;
      chatId = ctx.update.inline_query.from.id;
    } else if ('message' in ctx.update) {
      fromId = ctx.update.message.from.id;
      chatId = ctx.update.message.chat.id;
    } else if ('my_chat_member' in ctx.update) {
      fromId = ctx.update.my_chat_member.from.id;
      chatId = ctx.update.my_chat_member.chat.id;
    }

    if (fromId > 0 && chatId > 0) {
      return `${chatId}:${fromId}`;
    }

    this.logger.error('Session key generation fail', ctx.update);
  }
}
