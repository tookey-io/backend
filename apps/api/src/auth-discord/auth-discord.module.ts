import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthDiscordService } from './auth-discord.service';
import { AuthDiscordController } from './auth-discord.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, UserModule, AuthModule, HttpModule],
  providers: [AuthDiscordService],
  exports: [AuthDiscordService],
  controllers: [AuthDiscordController],
})
export class AuthDiscordModule {}
