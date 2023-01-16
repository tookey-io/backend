import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@tookey/database';
import { AofgProfileRepository } from '@tookey/database/entities/aofg-profile.entity';

import { DiscordModule } from '../discord/discord.module';
import { UserModule } from '../user/user.module';
import { AofgBot } from './aofg.bot';
import { AofgController } from './aofg.controller';
import { AofgService } from './aofg.service';

const AofgRepositories = TypeOrmExModule.forCustomRepository([AofgProfileRepository]);

@Module({
  imports: [UserModule, DiscordModule, AofgRepositories],
  controllers: [AofgController],
  providers: [AofgService, AofgBot],
  exports: [AofgService, AofgBot],
})
export class AofgModule {}
