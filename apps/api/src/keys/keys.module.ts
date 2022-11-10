import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AmqpModule } from '@tookey/amqp';
import {
  KeyParticipantRepository,
  KeyRepository,
  SignRepository,
  TypeOrmExModule,
  UserRepository,
} from '@tookey/database';

import { AccessModule } from '../../../../libs/access/src';
import { ApiKeyStrategy } from '../strategies/apikey.strategy';
import { KeyController } from './keys.controller';
import { KeyService } from './keys.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      KeyRepository,
      KeyParticipantRepository,
      SignRepository,
      UserRepository,
    ]),
    PassportModule,
    AmqpModule,
    AccessModule,
  ],
  controllers: [KeyController],
  providers: [KeyService, ApiKeyStrategy],
})
export class KeyModule {}
