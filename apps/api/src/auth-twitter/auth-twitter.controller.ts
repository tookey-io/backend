import { Body, ClassSerializerInterceptor, Controller, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthTokensResponseDto } from '../auth/auth.dto';
import { AuthService } from '../auth/auth.service';
import { AllRoles } from '../decorators/all-role.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { CreateTwitterUserDto } from "../user/user-twitter.dto";
import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { AuthTwitterLoginDto, AuthTwitterService } from './auth-twitter.service';

type CacheRecord<T> = {
  data: T;
  validUntil: number;
}

@Controller('api/auth')
@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthTwitterController {
  private authCache: Record<string, CacheRecord<Promise<AuthTokensResponseDto>>> = {};
  private connectCache: Record<string, CacheRecord<Promise<void>>> = {};

  constructor(
    private readonly twitterService: AuthTwitterService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}
  
  @ApiOperation({ description: 'Connects twitter account to existed user' })
  @JwtAuth()
  @HttpCode(204) // No content
  @AllRoles('user')
  @Post('twitter/connect')
  async twitterConnectCallback(@CurrentUser() user: UserContextDto, @Body() body: AuthTwitterLoginDto): Promise<void> {
    if (this.connectCache[body.code] && this.connectCache[body.code].validUntil > Date.now()) {
      return this.connectCache[body.code].data;
    }

    this.connectCache[body.code] = {
      data: this.internalTwitterConnectCallback(user, body),
      validUntil: Date.now() + 1000 * 5 // 5 seconds
    }

    setTimeout(() => {
      if (this.connectCache[body.code] && this.connectCache[body.code].validUntil < Date.now()) {
        delete this.connectCache[body.code];
      }
    }, 1000 * 6);

    return this.connectCache[body.code].data;
  }
  
  @ApiOperation({ description: 'Authenticate (or create) user with twitter OAuth credentials' })
  @Post('twitter')
  async twitterAuthCallback(@Body() body: AuthTwitterLoginDto): Promise<AuthTokensResponseDto> {
    if (this.authCache[body.code] && this.authCache[body.code].validUntil > Date.now()) {
      return this.authCache[body.code].data;
    }

    this.authCache[body.code] = {
      data: this.internalTwitterAuthCallback(body),
      validUntil: Date.now() + 1000 * 5 // 5 seconds
    }

    setTimeout(() => {
      if (this.authCache[body.code] && this.authCache[body.code].validUntil < Date.now()) {
        delete this.authCache[body.code];
      }
    }, 1000 * 6);

    return this.authCache[body.code].data;
  }

  private async internalTwitterAuthCallback(body: AuthTwitterLoginDto) {
    const profile = await this.twitterService.getProfileByCode(body);
    const user = await this.userService.getOrCreateTwitterUser(new CreateTwitterUserDto(profile));
    const access = this.authService.getJwtAccessToken(user.user);
    const refresh = this.authService.getJwtRefreshToken(user.user);
    await this.userService.setCurrentRefreshToken(refresh.token, user.userId);
    return { access, refresh, user: user.user };
  }

  private async internalTwitterConnectCallback(user: UserContextDto, body: AuthTwitterLoginDto) {
    const profile = await this.twitterService.getProfileByCode(body, true);
    await this.userService.getOrConnectTwitterUser(new CreateTwitterUserDto(profile), user);
  }
}
