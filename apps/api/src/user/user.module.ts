import { Module } from '@nestjs/common';
import {
  TypeOrmExModule,
  UserDiscordRepository,
  UserGoogleRepository,
  UserRepository,
  UserTelegramRepository,
  UserTwitterRepository,
} from '@tookey/database';

import { UserController } from './user.controller';
import { UserService } from './user.service';

const UserRepositories = TypeOrmExModule.forCustomRepository([
  UserRepository,
  UserTelegramRepository,
  UserGoogleRepository,
  UserDiscordRepository,
  UserTwitterRepository,
]);

@Module({
  imports: [UserRepositories],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserRepositories, UserService],
})
export class UserModule {}
