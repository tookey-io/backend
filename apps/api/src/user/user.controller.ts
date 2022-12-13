import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto, UserDto } from './user.dto';
import { UserService } from './user.service';

@Controller('api/users')
@ApiTags('Users')
@JwtAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ description: 'Get current user' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  @Get('me')
  async getCurrentUser(@CurrentUser() user: UserContextDto): Promise<UserDto> {
    return this.userService.getUser(user);
  }
}
