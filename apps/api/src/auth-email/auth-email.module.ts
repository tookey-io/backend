import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthEmailService } from './auth-email.service';
import { AuthEmailController } from './auth-email.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmExModule, UserEmailRepository } from '@tookey/database';

const AuthEmailRepositories = TypeOrmExModule.forCustomRepository([UserEmailRepository])

@Module({
  imports: [ConfigModule, UserModule, AuthModule, AuthEmailRepositories],
  providers: [AuthEmailService],
  exports: [AuthEmailService, AuthEmailRepositories],
  controllers: [AuthEmailController],
})
export class AuthEmailModule {}
