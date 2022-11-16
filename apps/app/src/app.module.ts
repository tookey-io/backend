import { ApiModule } from 'apps/api/src/api.module';
import { BotModule } from 'apps/bot/src/bot.module';
import { LoggerModule } from 'nestjs-pino';

import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from '@tookey/access';
import { DatabaseModule, DatabaseService } from '@tookey/database';

import { AppConfiguration, configuration } from './app.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: DatabaseService,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration>) => {
        const isProduction = config.get('isProduction', { infer: true });
        return {
          pinoHttp: {
            level: !isProduction ? 'debug' : 'info',
            transport: !isProduction ? { target: 'pino-pretty' } : undefined,
            useLevelLabels: true,
          },
        };
      },
    }),
    CacheModule.register({ isGlobal: true }),
    EventEmitterModule.forRoot({ global: true }),
    BotModule,
    ApiModule,
    AccessModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
