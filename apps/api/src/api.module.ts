import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { KeyModule } from './keys/keys.module';
import { PermissionModule } from './permission/permission.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [KeyModule, UserModule, AuthModule, PermissionModule],
})
export class ApiModule {}
