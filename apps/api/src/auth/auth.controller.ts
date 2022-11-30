import { ClassSerializerInterceptor, Controller, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessService } from '@tookey/access';

import { ApiKeyAuth } from '../decorators/apikey-auth.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtRefreshAuth } from '../decorators/jwt-refresh-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { AuthSigninResponseDto, AuthTokenDto } from './auth.dto';
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
  @ApiOkResponse({ type: AuthSigninResponseDto })
  @HttpCode(200)
  @Post('signin')
  async signin(@CurrentUser() user: UserContextDto): Promise<AuthSigninResponseDto> {
    const access = this.authService.getJwtAccessToken(user.id);
    const refresh = this.authService.getJwtRefreshToken(user.id);

    await this.userService.setCurrentRefreshToken(refresh.token, user.id);

    await this.accessService.refreshToken(user.id);
    this.eventEmitter.emit(AuthEvent.SIGNIN, user.id);

    return { access, refresh };
  }

  @JwtRefreshAuth()
  @ApiOperation({ description: 'Refresh access token' })
  @ApiOkResponse({ type: AuthTokenDto })
  @HttpCode(200)
  @Post('refresh')
  refresh(@CurrentUser() user: UserContextDto): AuthTokenDto {
    return this.authService.getJwtAccessToken(user.id);
  }
}
