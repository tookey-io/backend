import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';
import * as PostgresSession from 'telegraf-postgres-session';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '@tookey/database';

import { BotConfig } from './bot.types';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';

@Injectable()
export class BotService implements TelegrafOptionsFactory {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly configService: ConfigService<BotConfig & DatabaseConfig>,
    private readonly telegramUser: TelegramUserMiddleware,
    private readonly defaultState: DefaultStateMiddleware,
  ) {}

  createTelegrafOptions(): TelegrafModuleOptions {
    const { username, ...db } = this.configService.get('db', { infer: true });
    return {
      token: this.configService.get('telegramToken', { infer: true }),
      middlewares: [
        new PostgresSession({ ...db, user: username }).middleware(),
        this.telegramUser.use.bind(this.telegramUser),
        this.defaultState.use.bind(this.defaultState),
      ],
    };
  }
}
