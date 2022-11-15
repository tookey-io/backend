import { Module } from '@nestjs/common';
import { AccessModule } from '@tookey/access';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [AccessModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
