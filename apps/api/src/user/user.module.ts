import { Module } from '@nestjs/common';
import {
  TypeOrmExModule,
  UserRepository,
  UserTelegramRepository,
} from '@tookey/database';

import { UserController } from './user.controller';
import { UserService } from './user.service';

const UserRepositories = TypeOrmExModule.forCustomRepository([
  UserRepository,
  UserTelegramRepository,
]);

@Module({
  imports: [UserRepositories],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserRepositories, UserService],
})
export class UserModule {}
