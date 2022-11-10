import { TelegrafModule } from 'nestjs-telegraf';

import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';
import {
  TypeOrmExModule,
  UserRepository,
  UserTelegramRepository,
} from '@tookey/database';

import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';
import { KeysScene } from './scenes/keys.scene';
import { MenuScene } from './scenes/menu.scene';

@Module({
  imports: [
    AccessModule,
    TypeOrmExModule.forCustomRepository([
      UserRepository,
      UserTelegramRepository,
    ]),
    TelegrafModule.forRootAsync({
      useClass: BotService,
      imports: [BotModule],
    }),
  ],
  exports: [TelegramUserMiddleware, DefaultStateMiddleware],
  providers: [
    TelegramUserMiddleware,
    DefaultStateMiddleware,
    BotService,
    BotUpdate,
    MenuScene,
    KeysScene,
  ],
})
export class BotModule {}
