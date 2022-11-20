import { ClassSerializerInterceptor, Controller, Post, UseInterceptors } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessService } from '@tookey/access';

import { ApiKeyAuth } from '../decorators/apikey-auth.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtRefreshAuth } from '../decorators/jwt-refresh-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { AuthTokenResponseDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthEvent } from './auth.types';

@Controller('api/auth')
@ApiTags('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly accessService: AccessService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @ApiKeyAuth()
  @ApiOperation({ description: 'Show access and refresh tokens' })
  @ApiOkResponse({ type: [AuthTokenResponseDto] })
  @Post('signin')
  async signin(@CurrentUser() user: UserContextDto): Promise<AuthTokenResponseDto[]> {
    const accessToken = this.authService.getJwtAccessToken(user.id);
    const refreshToken = this.authService.getJwtRefreshToken(user.id);

    await this.userService.setCurrentRefreshToken(refreshToken.token, user.id);

    await this.accessService.refreshToken(user.id);
    this.eventEmitter.emit(AuthEvent.SIGNIN, user.id);

    return [accessToken, refreshToken];
  }

  @JwtRefreshAuth()
  @Post('refresh')
  refresh(@CurrentUser() user: UserContextDto): AuthTokenResponseDto {
    return this.authService.getJwtAccessToken(user.id);
  }
}
