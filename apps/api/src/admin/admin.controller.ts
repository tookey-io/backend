import { ClassSerializerInterceptor, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto, UserDto } from '../user/user.dto';
import { AdminService } from './admin.service';

@Controller('api/admin')
@ApiTags('Admin')
@JwtAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ description: 'Remove user data' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  @Post('user/remove')
  async removeUserData(@CurrentUser() user: UserContextDto): Promise<UserDto> {
    return this.adminService.removeUserData(user.id);
  }
}
