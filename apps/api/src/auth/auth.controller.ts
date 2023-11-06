import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { GoogleAuthLoginDto, AuthGoogleService } from 'apps/api/src/auth-google/auth-google.service';

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
  async signinFlow(@CurrentUser() userDto: UserContextDto) {
    const userRequest = {
      id: userDto.user.id.toString(),
      firstName: userDto.user.firstName,
      lastName: userDto.user.lastName,
      trackEvents: true,
      newsLetter: true,
    };
    await this.flowsService.injectUser(userRequest);
    const flowUser = await this.flowsService.authUser({
      id: userRequest.id,
      token: this.authService.getJwtServiceToken(userDto.user).token,
    });

    this.eventEmitter.emit(AuthEvent.SIGNIN, userDto.user.id, 'Automation');
    return flowUser;
  }

  @SigninKeyAuth()
  @ApiOperation({ description: 'Get access and refresh tokens' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @HttpCode(200)
  @Post('signin')
  async signin(@CurrentUser() user: UserContextDto): Promise<AuthTokensResponseDto> {
    const access = this.authService.getJwtAccessToken(user.user);
    const refresh = this.authService.getJwtRefreshToken(user.user);

    await this.userService.setCurrentRefreshToken(refresh.token, user.id);

    await this.accessService.refreshToken(user.id);
    this.eventEmitter.emit(AuthEvent.SIGNIN, user.id);

    return { access, refresh , user: user.user as any };
  }

  @AnyRoles('refresh')
  @JwtAuth()
  @ApiOperation({ description: 'Refresh access token' })
  @ApiOkResponse({ type: AuthTokenDto })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@CurrentUser() user: UserContextDto): Promise<AuthTokensResponseDto> {
    const access = this.authService.getJwtAccessToken(user.user);
    const refresh = this.authService.getJwtRefreshToken(user.user);
    await this.userService.setCurrentRefreshToken(refresh.token, user.id);
    return { access, refresh , user: user.user as any };
  }

  // @ApiOperation({ description: 'Get twitter auth url' })
  // @ApiOkResponse({ type: TwitterAuthUrlResponseDto })
  // @Get('twitter')
  // async twitterAuthUrl(): Promise<TwitterAuthUrlResponseDto> {
  //   const { url, state, codeVerifier } = await this.twitterService.getAuthLink();
  //   this.twitterService.saveSession(state, codeVerifier);
  //   return { url };
  // }

  // @ApiOperation({ description: 'Get access and refresh tokens with twitter' })
  // @ApiOkResponse({ type: AuthTokensResponseDto })
  // @Post('twitter')
  // async twitterAuthCallback(@Body() body: AuthTwitterCallbackDto): Promise<AuthTokensResponseDto> {
  //   const session = await this.twitterService.loadSession(body.state);
  //   if (!session) throw new BadRequestException('Session not found');

  //   const user = await this.twitterService.requestUser({ code: body.code, codeVerifier: session.codeVerifier });
  //   const access = this.authService.getJwtAccessToken({ id: user.userId, roles: ['user', 'twitter'] });
  //   const refresh = this.authService.getJwtRefreshToken({ id: user.userId, roles: ['user', 'twitter'] });
  //   await this.userService.setCurrentRefreshToken(refresh.token, user.id);
  //   return { access, refresh, user: user.user as any };
  // }

  // @ApiOperation({ description: 'Get discord auth url' })
  // @ApiOkResponse({ type: DiscordAuthUrlResponseDto })
  // @Get('discord')
  // async discordAuthUrl(@Query('state') state?: string): Promise<DiscordAuthUrlResponseDto> {
  //   return await this.discordService.getAuthLink(state);
  // }

  // @ApiOperation({ description: 'Get access and refresh tokens with discord' })
  // @ApiOkResponse({ type: AuthTokensResponseDto })
  // @Post('discord')
  // async discordAuthCallback(@Body() { code }: DiscordAccessTokenRequestDto): Promise<AuthTokensResponseDto> {
  //   console.log('discord auth', code)
  //   const user = await this.discordService.requestUser({ code });
  //   if (!user) {
  //     return null
  //   }
  //   const access = this.authService.getJwtAccessToken({ id: user.userId, roles: ['user', 'discord'] });
  //   const refresh = this.authService.getJwtRefreshToken({ id: user.userId, roles: ['user', 'discord'] });
  //   await this.userService.setCurrentRefreshToken(refresh.token, user.id);
  //   return { access, refresh, user: user.user };
  // }
  
  @ApiOperation({ description: 'Get OTP token to connect external service' })
  @ApiOkResponse({ type: AuthTokenDto })
  @JwtAuth()
  @Get('access')
  async getAccessToken(@CurrentUser() user: UserContextDto) {
    return this.accessService.getAccessToken(user.id);
  }
}
