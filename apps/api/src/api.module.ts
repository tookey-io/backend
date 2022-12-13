import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { KeyModule } from './keys/keys.module';
import { ShareableTokenModule } from './shareable-token/shareable-token.module';
import { TwitterModule } from './twitter/twitter.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [KeyModule, UserModule, AuthModule, ShareableTokenModule, TwitterModule],
})
export class ApiModule {}
