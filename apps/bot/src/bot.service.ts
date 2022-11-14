import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '@tookey/database';

import { BotConfig } from './bot.types';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramSessionMiddleware } from './middlewares/telegram-session.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';

@Injectable()
export class BotService implements TelegrafOptionsFactory {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly configService: ConfigService<BotConfig & DatabaseConfig>,
    private readonly telegramSession: TelegramSessionMiddleware,
    private readonly telegramUser: TelegramUserMiddleware,
    private readonly defaultState: DefaultStateMiddleware,
  ) {}

  createTelegrafOptions(): TelegrafModuleOptions {
    return {
      token: this.configService.get('telegramToken', { infer: true }),
      middlewares: [
        this.telegramUser.use.bind(this.telegramUser),
        this.telegramSession.use.bind(this.telegramSession),
        this.defaultState.use.bind(this.defaultState),
      ],
    };
  }
}
