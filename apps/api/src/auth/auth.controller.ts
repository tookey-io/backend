import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessService } from '@tookey/access';

import { AuthEvent } from '../api.events';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SigninKeyAuth } from '../decorators/signin-key-auth.decorator';
import { DiscordAccessTokenRequestDto, DiscordAuthUrlResponseDto } from '../discord/discord.dto';
import { DiscordService } from '../discord/discord.service';
import { TwitterAuthUrlResponseDto } from '../twitter/twitter.dto';
import { TwitterService } from '../twitter/twitter.service';
import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { AuthTokenDto, AuthTokensResponseDto, AuthTwitterCallbackDto } from './auth.dto';
import { AuthService } from './auth.service';
import { FlowsService } from '@tookey/flows';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { AnyRoles } from '../decorators/any-role.decorator';

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
    private readonly discordService: DiscordService,
    private readonly flowsService: FlowsService,
  ) {}

  @ApiOperation({ description: 'Admin token' })
  @ApiOkResponse({ type: AuthTokenDto })
  @HttpCode(200)
  @Post('/admin')
  async adminAuth(@Body() { key }: { key: string }): Promise<AuthTokenDto> {
    return this.authService.getJwtAdminToken(key);
  }

  @ApiOperation({ description: 'Storing new or skip device firebase token' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @HttpCode(200)
  @Put('firebase-token')
  async addUserDeviceToken(@CurrentUser() user: UserContextDto, @Body() body: { token: string }) {
    throw new BadRequestException('Not implemented');
    // await this.userService.addUserDeviceToken({ userId: user.id, token: body.token });
  }

  @SigninKeyAuth()
  @ApiOperation({ description: 'Get access and refresh tokens' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @HttpCode(200)
  @Post('flows')
  async signinFlow(@CurrentUser() user: UserContextDto) {
    const telegramUser = await this.userService.getTelegramUser({ userId: user.id });
    if (!telegramUser) throw new NotFoundException('Telegram user not found');

    const userRequest = {
      id: user.id.toString(),
      firstName: telegramUser.firstName,
      lastName: telegramUser.lastName,
      trackEvents: true,
      newsLetter: true,
    };
    await this.flowsService.injectUser(userRequest);
    const flowUser = await this.flowsService.authUser({
      id: userRequest.id,
      token: this.authService.getJwtServiceToken({
        id: user.id,
        roles: ['user', 'flows'],
      }).token,
    });

    this.eventEmitter.emit(AuthEvent.SIGNIN, user.id, 'Automation');
    return flowUser;
  }

  @SigninKeyAuth()
  @ApiOperation({ description: 'Get access and refresh tokens' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @HttpCode(200)
  @Post('signin')
  async signin(@CurrentUser() user: UserContextDto): Promise<AuthTokensResponseDto> {
    const access = this.authService.getJwtAccessToken({ id: user.id, roles: ['user', 'otp'] });
    const refresh = this.authService.getJwtRefreshToken({ id: user.id, roles: ['user', 'otp'] });

    await this.userService.setCurrentRefreshToken(refresh.token, user.id);

    await this.accessService.refreshToken(user.id);
    this.eventEmitter.emit(AuthEvent.SIGNIN, user.id);

    return { access, refresh };
  }

  @AnyRoles('refresh')
  @JwtAuth()
  @ApiOperation({ description: 'Refresh access token' })
  @ApiOkResponse({ type: AuthTokenDto })
  @HttpCode(200)
  @Post('refresh')
  refresh(@CurrentUser() user: UserContextDto): AuthTokenDto {
    return this.authService.getJwtAccessToken({ id: user.id, roles: ['user', 'discord'] });
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
    const access = this.authService.getJwtAccessToken({ id: user.userId, roles: ['user', 'twitter'] });
    const refresh = this.authService.getJwtRefreshToken({ id: user.userId, roles: ['user', 'twitter'] });
    await this.userService.setCurrentRefreshToken(refresh.token, user.id);
    return { access, refresh };
  }

  @ApiOperation({ description: 'Get discord auth url' })
  @ApiOkResponse({ type: DiscordAuthUrlResponseDto })
  @Get('discord')
  async discordAuthUrl(@Query('state') state?: string): Promise<DiscordAuthUrlResponseDto> {
    return await this.discordService.getAuthLink(state);
  }

  @ApiOperation({ description: 'Get access and refresh tokens with discord' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @Post('discord')
  async discordAuthCallback(@Body() { code }: DiscordAccessTokenRequestDto): Promise<AuthTokensResponseDto> {
    const user = await this.discordService.requestUser({ code });
    const access = this.authService.getJwtAccessToken({ id: user.userId, roles: ['user', 'discord'] });
    const refresh = this.authService.getJwtRefreshToken({ id: user.userId, roles: ['user', 'discord'] });
    await this.userService.setCurrentRefreshToken(refresh.token, user.id);
    return { access, refresh };
  }
}
