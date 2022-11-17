import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccessModule } from '@tookey/access';
import { AmqpModule } from '@tookey/amqp';
import { KeyParticipantRepository, KeyRepository, SignRepository, TypeOrmExModule } from '@tookey/database';

import { ApiKeyStrategy } from '../strategies/apikey.strategy';
import { UserModule } from '../user/user.module';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

const KeysRepositories = TypeOrmExModule.forCustomRepository([KeyRepository, KeyParticipantRepository, SignRepository]);

@Module({
  imports: [KeysRepositories, PassportModule, AmqpModule, AccessModule, UserModule],
  controllers: [KeysController],
  providers: [KeysService, ApiKeyStrategy],
  exports: [KeysRepositories, KeysService],
})
export class KeyModule {}
