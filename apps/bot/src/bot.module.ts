import { KeyModule } from 'apps/api/src/keys/keys.module';
import { ShareableTokenModule } from 'apps/api/src/shareable-token/shareable-token.module';
import { UserModule } from 'apps/api/src/user/user.module';
import { TelegrafModule } from 'nestjs-telegraf';

import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';
import { TelegramSessionRepository, TypeOrmExModule } from '@tookey/database';

import { BotEventHandler } from './bot.events';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { TelegramSessionMiddleware } from './middlewares/telegram-session.middleware';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';
import { AuthScene } from './scenes/auth.scene';
import { InitScene } from './scenes/init.scene';
import { KeyShareScene } from './scenes/key-share.scene';
import { ShareableTokenCreateScene } from './scenes/shareable-token-create.scene';
import { KeysUpdate } from './updates/keys.update';
import { ShareableTokensUpdate } from './updates/shareable-tokens.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({ useClass: BotService, imports: [BotModule] }),
    TypeOrmExModule.forCustomRepository([TelegramSessionRepository]),
    AccessModule,
    UserModule,
    KeyModule,
    ShareableTokenModule,
  ],
  providers: [
    TelegramUserMiddleware,
    DefaultStateMiddleware,
    TelegramSessionMiddleware,
    BotService,
    BotEventHandler,
    BotUpdate,
    KeysUpdate,
    ShareableTokensUpdate,
    InitScene,
    AuthScene,
    KeyShareScene,
    ShareableTokenCreateScene,
  ],
  exports: [TelegramUserMiddleware, DefaultStateMiddleware, TelegramSessionMiddleware],
})
export class BotModule {}
