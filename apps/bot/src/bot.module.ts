import { Module } from '@nestjs/common';
import { UserRepository } from '@tookey/database/entities/user.entity';
import { TypeOrmExModule } from '@tookey/database/typeorm-ex-module';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { TelegramUserMiddleware } from './middlewares/telegram-user.middleware';
import { KeysScene } from './scenes/keys.scene';
import { MenuScene } from './scenes/menu.scene';
import { DefaultStateMiddleware } from './middlewares/default-state.middleware';
import { AccessModule } from 'libs/access/src';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository])
  ],
  providers: [TelegramUserMiddleware, DefaultStateMiddleware],
  exports: [TelegramUserMiddleware, DefaultStateMiddleware]
})
export class TelegrafUnderlyingModule { }

@Module({
  imports: [
    AccessModule,
    TypeOrmExModule.forCustomRepository([UserRepository]),
    TelegrafModule.forRootAsync({
      useClass: BotService,
      imports: [BotModule],
    })
  ],
  exports: [TelegramUserMiddleware, DefaultStateMiddleware],
  providers: [TelegramUserMiddleware, DefaultStateMiddleware, BotService, BotUpdate, MenuScene, KeysScene],
})
export class BotModule { }
