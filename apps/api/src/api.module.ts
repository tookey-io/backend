import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { KeyModule } from './keys/keys.module';
import { PipefyModule } from './pipefy/pipefy.module';
import { ShareableTokenModule } from './shareable-token/shareable-token.module';
import { TwitterModule } from './twitter/twitter.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [KeyModule, UserModule, AuthModule, ShareableTokenModule, TwitterModule, PipefyModule],
})
export class ApiModule {}
