import { ClassSerializerInterceptor, Controller, Get, Param, ParseIntPipe, Post, UseInterceptors } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { User } from '@tookey/database';
import { AuthTokenDto } from '../auth/auth.dto';
import { AnyRoles } from '../decorators/any-role.decorator';
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

  @AnyRoles('user.write')
  @ApiOperation({ description: 'Remove user data' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  @Post('user/remove')
  async removeUserData(@CurrentUser() user: UserContextDto): Promise<UserDto> {
    return this.adminService.removeUserData(user.id);
  }


  @AnyRoles('admin', 'assistant')
  @ApiOperation({ description: 'Returns list of all registered users' })
  @ApiOkResponse({ type: User, isArray: true })
  @ApiNotFoundResponse()
  @Get('users')
  async getUsers(): Promise<User[]> {
    return this.adminService.getAllUsers();
  }

  @AnyRoles('admin')
  @ApiOperation({ description: 'Creates one time password to auth in Automation' })
  @ApiOkResponse({ type: AuthTokenDto })
  @ApiNotFoundResponse()
  @Get('user/:id/otp')
  async getUserOtp(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.getUserOtp(userId);
  }
}
