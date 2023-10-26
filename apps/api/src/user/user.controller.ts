import { ClassSerializerInterceptor, Controller, Get, NotFoundException, UseInterceptors } from '@nestjs/common';
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
    console.log({
      user,
      method: 'getCurrentUser',
    });
    const userDto = await this.userService.getUser(
      { id: user.id },
      { relations: ['parent', 'google', 'email', 'twitter', 'telegram', 'discord'] },
    );

    if (!userDto) throw new NotFoundException('User not found');

    return userDto;
  }
}
