import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';
import { session } from 'telegraf';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BotConfig } from './bot.types';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';

@Injectable()
export class BotService implements TelegrafOptionsFactory {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly configService: ConfigService<BotConfig>,
    private readonly telegramUser: TelegramUserMiddleware,
    private readonly defaultState: DefaultStateMiddleware,
  ) {}

  createTelegrafOptions(): TelegrafModuleOptions {
    return {
      token: this.configService.get('telegramToken', { infer: true }),
      middlewares: [
        session(),
        this.telegramUser.use.bind(this.telegramUser),
        this.defaultState.use.bind(this.defaultState),
      ],
    };
  }
}
