import { Body, ClassSerializerInterceptor, Controller, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthTokensResponseDto } from '../auth/auth.dto';
import { AuthService } from '../auth/auth.service';
import { AllRoles } from '../decorators/all-role.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { CreateDiscordUserDto } from '../user/user-google.dto';
import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { AuthDiscordLoginDto, AuthDiscordService } from './auth-discord.service';

type CacheRecord<T> = {
  data: T;
  validUntil: number;
}

@Controller('api/auth')
@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthDiscordController {
  private authCache: Record<string, CacheRecord<Promise<AuthTokensResponseDto>>> = {};
  private connectCache: Record<string, CacheRecord<Promise<void>>> = {};

  constructor(
    private readonly discordService: AuthDiscordService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}
  
  @ApiOperation({ description: 'Connects discord account to existed user' })
  @JwtAuth()
  @HttpCode(204) // No content
  @AllRoles('user')
  @Post('discord/connect')
  async discordConnectCallback(@CurrentUser() user: UserContextDto, @Body() body: AuthDiscordLoginDto): Promise<void> {
    if (this.connectCache[body.code] && this.connectCache[body.code].validUntil > Date.now()) {
      return this.connectCache[body.code].data;
    }

    this.connectCache[body.code] = {
      data: this.internalDiscordConnectCallback(user, body),
      validUntil: Date.now() + 1000 * 5 // 5 seconds
    }

    setTimeout(() => {
      if (this.connectCache[body.code] && this.connectCache[body.code].validUntil < Date.now()) {
        delete this.connectCache[body.code];
      }
    }, 1000 * 6);

    return this.connectCache[body.code].data;
  }
  
  @ApiOperation({ description: 'Authenticate (or create) user with discord OAuth credentials' })
  @Post('discord')
  async discordAuthCallback(@Body() body: AuthDiscordLoginDto): Promise<AuthTokensResponseDto> {
    if (this.authCache[body.code] && this.authCache[body.code].validUntil > Date.now()) {
      return this.authCache[body.code].data;
    }

    this.authCache[body.code] = {
      data: this.internalDiscordAuthCallback(body),
      validUntil: Date.now() + 1000 * 5 // 5 seconds
    }

    setTimeout(() => {
      if (this.authCache[body.code] && this.authCache[body.code].validUntil < Date.now()) {
        delete this.authCache[body.code];
      }
    }, 1000 * 6);

    return this.authCache[body.code].data;
  }

  private async internalDiscordAuthCallback(body: AuthDiscordLoginDto) {
    console.log('uncached auth')
    const profile = await this.discordService.getProfileByCode(body);
    const user = await this.userService.getOrCreateDiscordUser(new CreateDiscordUserDto(profile));
    const access = this.authService.getJwtAccessToken({ id: user.userId, roles: ['user', 'google'] });
    const refresh = this.authService.getJwtRefreshToken({ id: user.userId, roles: ['user', 'google'] });
    await this.userService.setCurrentRefreshToken(refresh.token, user.userId);
    return { access, refresh, user: user.user };
  }

  private async internalDiscordConnectCallback(user: UserContextDto, body: AuthDiscordLoginDto) {
    const profile = await this.discordService.getProfileByCode(body, true);
    await this.userService.getOrConnectDiscordUser(new CreateDiscordUserDto(profile), user);
  }
}
