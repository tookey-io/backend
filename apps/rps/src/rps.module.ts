import { AppConfiguration } from 'apps/app/src/app.config';

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RPS_QUEUE } from './rps.constants';
import { RpsGateway } from './rps.gateway';
import { RpsProcessor } from './rps.processor';
import { RpsService } from './rps.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfiguration>) => ({
        prefix: 'rps',
        redis: configService.get('redis', { infer: true }),
      }),
    }),
    BullModule.registerQueue({ name: RPS_QUEUE }),
  ],
  providers: [RpsService, RpsProcessor, RpsGateway],
})
export class RpsModule {}
