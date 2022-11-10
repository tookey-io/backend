import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../decorators/current-user.decorator';
import { UserDto } from './user.dto';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getCurrentUser(@CurrentUser() user: UserDto): UserDto {
    return user;
  }
}
