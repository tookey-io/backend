import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';
import { AmqpModule } from '@tookey/amqp';
import { KeyParticipantRepository, KeyRepository, SignRepository, TypeOrmExModule } from '@tookey/database';

import { UserModule } from '../user/user.module';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

const KeysRepositories = TypeOrmExModule.forCustomRepository([KeyRepository, KeyParticipantRepository, SignRepository]);

@Module({
  imports: [KeysRepositories, AmqpModule, AccessModule, UserModule],
  controllers: [KeysController],
  providers: [KeysService],
  exports: [KeysRepositories, KeysService],
})
export class KeyModule {}
