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
import { UserContextDto } from '../user/user.dto';
import { AccessTokenResponseDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('api/auth')
@ApiTags('auth')
@Auth()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ description: 'Show auth token' })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  @ApiNotFoundResponse()
  @Get('token')
  async getAuthToken(
    @CurrentUser() user: UserContextDto,
  ): Promise<AccessTokenResponseDto> {
    return this.authService.getAccessToken(user.id);
  }
}
