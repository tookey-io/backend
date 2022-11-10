import { Module } from '@nestjs/common';
import { TypeOrmExModule, UserRepository } from '@tookey/database';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmExModule.forCustomRepository([UserRepository])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
