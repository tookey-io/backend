import { UserModule } from 'apps/api/src/user/user.module';
import { TelegrafModule } from 'nestjs-telegraf';

import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';
import { TelegramSessionRepository, TypeOrmExModule } from '@tookey/database';

import { KeyModule } from '../../api/src/keys/keys.module';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramSessionMiddleware } from './middlewares/telegram-session.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';
import { AuthScene } from './scenes/auth.scene';
import { InitScene } from './scenes/init.scene';

@Module({
  imports: [
    TelegrafModule.forRootAsync({ useClass: BotService, imports: [BotModule] }),
    TypeOrmExModule.forCustomRepository([TelegramSessionRepository]),
    AccessModule,
    UserModule,
    KeyModule,
  ],
  providers: [
    TelegramUserMiddleware,
    DefaultStateMiddleware,
    TelegramSessionMiddleware,
    BotService,
    BotUpdate,
    InitScene,
    AuthScene,
  ],
  exports: [TelegramUserMiddleware, DefaultStateMiddleware, TelegramSessionMiddleware],
})
export class BotModule {}
