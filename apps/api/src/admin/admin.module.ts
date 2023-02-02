import { Module } from '@nestjs/common';
import {
  KeyRepository,
  SignRepository,
  TypeOrmExModule,
  UserDiscordRepository,
  UserRepository,
} from '@tookey/database';

import { UserModule } from '../user/user.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

const AdminRepositories = TypeOrmExModule.forCustomRepository([
  UserRepository,
  UserDiscordRepository,
  KeyRepository,
  SignRepository,
]);

@Module({
  imports: [AdminRepositories, UserModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
