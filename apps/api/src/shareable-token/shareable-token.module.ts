import { Module } from '@nestjs/common';
import { PermissionRepository, ShareableTokenRepository, TypeOrmExModule } from '@tookey/database';

import { KeyModule } from '../keys/keys.module';
import { ShareableTokenController } from './shareable-token.controller';
import { ShareableTokenService } from './shareable-token.service';

const ShareableTokenRepositories = TypeOrmExModule.forCustomRepository([
  PermissionRepository,
  ShareableTokenRepository,
]);

@Module({
  imports: [ShareableTokenRepositories, KeyModule],
  providers: [ShareableTokenService],
  controllers: [ShareableTokenController],
  exports: [ShareableTokenRepositories, ShareableTokenService],
})
export class ShareableTokenModule {}
