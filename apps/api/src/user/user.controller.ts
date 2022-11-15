import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Auth } from '../decorators/auth.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserContextDto, UserDto } from './user.dto';
import { UserService } from './user.service';

@Controller('api/users')
@ApiTags('users')
@Auth()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ description: 'Get current user' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  @Get('me')
  async getCurrentUser(
    @CurrentUser() userContext: UserContextDto,
  ): Promise<UserDto> {
    const user = await this.userService.getUser(userContext);
    return user;
  }
}
