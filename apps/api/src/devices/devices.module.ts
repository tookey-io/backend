import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { KeyModule } from '../keys/keys.module';
import { TypeOrmExModule, UserDeviceRepository } from '@tookey/database';
import { EventEmitterModule } from '@nestjs/event-emitter';

const DevicesRepositories = TypeOrmExModule.forCustomRepository([UserDeviceRepository]);


@Module({
  imports: [
    DevicesRepositories,
    KeyModule,
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesRepositories, DevicesService],
})
export class DevicesModule {}
