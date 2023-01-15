import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';
import { AmqpModule } from '@tookey/amqp';
import { KeyParticipantRepository, KeyRepository, SignRepository, TypeOrmExModule } from '@tookey/database';

import { UserModule } from '../user/user.module';
import { KEYS_QUEUE } from './keys.constants';
import { KeysController } from './keys.controller';
import { KeysProcessor } from './keys.processor';
import { KeysService } from './keys.service';

const KeysRepositories = TypeOrmExModule.forCustomRepository([KeyRepository, KeyParticipantRepository, SignRepository]);

@Module({
  imports: [KeysRepositories, AmqpModule, AccessModule, UserModule, BullModule.registerQueue({ name: KEYS_QUEUE })],
  controllers: [KeysController],
  providers: [KeysService, KeysProcessor],
  exports: [KeysRepositories, KeysService],
})
export class KeyModule {}
