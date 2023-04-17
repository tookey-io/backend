import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmExModule, UserDiscordRepository } from '@tookey/database';

import { UserModule } from '../user/user.module';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

const DiscordRepositories = TypeOrmExModule.forCustomRepository([UserDiscordRepository]);

@Module({
  imports: [UserModule, DiscordRepositories, HttpModule],
  controllers: [DiscordController],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
