import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessService } from '@tookey/access';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtRefreshAuth } from '../decorators/jwt-refresh-auth.decorator';
import { SigninKeyAuth } from '../decorators/signin-key-auth.decorator';
import { TwitterAuthUrlResponseDto } from '../twitter/twitter.dto';
import { TwitterService } from '../twitter/twitter.service';
import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { AuthTokenDto, AuthTokensResponseDto, AuthTwitterCallbackDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthEvent } from './auth.types';

@Controller('api/auth')
@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly accessService: AccessService,
    private readonly eventEmitter: EventEmitter2,
    private readonly twitterService: TwitterService,
  ) {}

  @SigninKeyAuth()
  @ApiOperation({ description: 'Get access and refresh tokens' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @HttpCode(200)
  @Post('signin')
  async signin(@CurrentUser() user: UserContextDto): Promise<AuthTokensResponseDto> {
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

  @ApiOperation({ description: 'Get twitter auth url' })
  @ApiOkResponse({ type: TwitterAuthUrlResponseDto })
  @Get('twitter')
  async twitterAuthUrl(): Promise<TwitterAuthUrlResponseDto> {
    const { url, state, codeVerifier } = await this.twitterService.getAuthLink();
    this.twitterService.saveSession(state, codeVerifier);
    return { url };
  }

  @ApiOperation({ description: 'Get access and refresh tokens with twitter' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @Post('twitter')
  async twitterAuthCallback(@Body() body: AuthTwitterCallbackDto): Promise<AuthTokensResponseDto> {
    const session = await this.twitterService.loadSession(body.state);
    if (!session) throw new BadRequestException('Session not found');

    const user = await this.twitterService.requestUser({ code: body.code, codeVerifier: session.codeVerifier });
    const access = this.authService.getJwtAccessToken(user.userId);
    const refresh = this.authService.getJwtRefreshToken(user.userId);
    await this.userService.setCurrentRefreshToken(refresh.token, user.id);
    return { access, refresh };
  }
}
