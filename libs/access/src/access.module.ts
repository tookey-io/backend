import { Module } from '@nestjs/common';
import { AccessTokenRepository, TypeOrmExModule } from '@tookey/database';

import { AccessService } from './access.service';

const AccessRepositories = TypeOrmExModule.forCustomRepository([AccessTokenRepository]);

@Module({
  imports: [AccessRepositories],
  providers: [AccessService],
  exports: [AccessService, AccessRepositories],
})
export class AccessModule {}
