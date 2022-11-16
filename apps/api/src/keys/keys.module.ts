import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccessModule } from '@tookey/access';
import { AmqpModule } from '@tookey/amqp';
import { KeyParticipantRepository, KeyRepository, SignRepository, TypeOrmExModule } from '@tookey/database';

import { ApiKeyStrategy } from '../strategies/apikey.strategy';
import { UserModule } from '../user/user.module';
import { KeyController } from './keys.controller';
import { KeyService } from './keys.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([KeyRepository, KeyParticipantRepository, SignRepository]),
    PassportModule,
    AmqpModule,
    AccessModule,
    UserModule,
  ],
  controllers: [KeyController],
  providers: [KeyService, ApiKeyStrategy],
})
export class KeyModule {}
