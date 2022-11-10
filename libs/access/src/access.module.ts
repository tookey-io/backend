import { Module } from '@nestjs/common';
import { AccessTokenRepository, TypeOrmExModule } from '@tookey/database';

import { AccessService } from './access.service';

@Module({
  imports: [TypeOrmExModule.forCustomRepository([AccessTokenRepository])],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
