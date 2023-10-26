import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthTwitterService } from './auth-twitter.service';
import { AuthTwitterController } from './auth-twitter.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, UserModule, AuthModule, HttpModule],
  providers: [AuthTwitterService],
  exports: [AuthTwitterService],
  controllers: [AuthTwitterController],
})
export class AuthTwitterModule {}
