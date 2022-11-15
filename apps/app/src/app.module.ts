import { ApiModule } from 'apps/api/src/api.module';
import { BotModule } from 'apps/bot/src/bot.module';

import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from '@tookey/access';
import { DatabaseModule, DatabaseService } from '@tookey/database';

import { configuration } from './app.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: DatabaseService,
    }),
    CacheModule.register({ isGlobal: true }),
    EventEmitterModule.forRoot({ global: true }),
    BotModule,
    ApiModule,
    AccessModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
