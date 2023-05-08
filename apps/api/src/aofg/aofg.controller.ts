import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { AofgService } from './aofg.service';

@Controller('api/aofg')
@ApiTags('AOFG')
@UseInterceptors(ClassSerializerInterceptor)
export class AofgController {
  constructor(private readonly aofgService: AofgService) {}

  @JwtAuth()
  @Get('me')
  async getMyProfile(@CurrentUser() user: UserContextDto) {
    return this.aofgService.getOrCreateProfile({ userId: user.id });
  }
}
