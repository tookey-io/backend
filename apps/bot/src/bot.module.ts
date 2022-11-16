import { TelegrafModule } from 'nestjs-telegraf';

import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';
import {
  KeyParticipantRepository,
  KeyRepository,
  TelegramSessionRepository,
  TypeOrmExModule,
  UserRepository,
  UserTelegramRepository,
} from '@tookey/database';

import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramSessionMiddleware } from './middlewares/telegram-session.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';
import { AuthScene } from './scenes/auth.scene';
import { InitScene } from './scenes/init.scene';
import { KeysScene } from './scenes/keys.scene';

const Repositories = TypeOrmExModule.forCustomRepository([
  UserRepository,
  UserTelegramRepository,
  KeyRepository,
  KeyParticipantRepository,
  TelegramSessionRepository,
]);

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useClass: BotService,
      imports: [BotModule],
    }),
    Repositories,
    AccessModule,
  ],
  providers: [
    TelegramUserMiddleware,
    DefaultStateMiddleware,
    TelegramSessionMiddleware,
    BotService,
    BotUpdate,
    InitScene,
    AuthScene,
    KeysScene,
  ],
  exports: [TelegramUserMiddleware, DefaultStateMiddleware, TelegramSessionMiddleware],
})
export class BotModule {}
