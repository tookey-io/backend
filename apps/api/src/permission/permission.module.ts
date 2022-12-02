import { Module } from '@nestjs/common';
import {
  PermissionRepository,
  PermissionTokenRepository,
  TypeOrmExModule,
  UserPermissionTokenRepository,
} from '@tookey/database';

import { KeyModule } from '../keys/keys.module';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

const PermissionRepositories = TypeOrmExModule.forCustomRepository([
  PermissionRepository,
  UserPermissionTokenRepository,
  PermissionTokenRepository,
]);

@Module({
  imports: [PermissionRepositories, KeyModule],
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionRepositories, PermissionService],
})
export class PermissionModule {}
