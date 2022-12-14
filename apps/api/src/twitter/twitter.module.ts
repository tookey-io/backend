import { Module } from '@nestjs/common';
import { TwitterSessionRepository, TypeOrmExModule, UserTwitterRepository } from '@tookey/database';

import { UserModule } from '../user/user.module';
import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';

const TwitterRepositories = TypeOrmExModule.forCustomRepository([UserTwitterRepository, TwitterSessionRepository]);

@Module({
  imports: [UserModule, TwitterRepositories],
  controllers: [TwitterController],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
