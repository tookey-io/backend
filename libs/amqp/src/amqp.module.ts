import { AmpqConfig } from 'apps/app/src/app.config';

import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AmqpService } from './amqp.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      inject: [ConfigService],
      useFactory: (config: ConfigService<AmpqConfig>) => {
        const { uri, topics } = config.get('amqp', { infer: true });
        return {
          uri,
          exchanges: topics.map((name) => ({ name, type: 'topic' })),
          channels: {
            default: {
              prefetchCount: 15,
              default: true,
            },
          },
          connectionInitOptions: { wait: true },
          enableControllerDiscovery: true,
        };
      },
    }),
  ],
  providers: [AmqpService],
  exports: [AmqpService],
})
export class AmqpModule {}
