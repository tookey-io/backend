import { Module } from '@nestjs/common';

import { KeyModule } from './keys/keys.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [KeyModule, UserModule],
})
export class ApiModule {}
