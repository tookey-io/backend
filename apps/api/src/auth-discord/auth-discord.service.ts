import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AppConfiguration } from 'apps/app/src/app.config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export class AuthDiscordLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  code: string;
}

export interface SocialInterface {
  googleId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  payload: TokenPayload;
}

@Injectable()
export class AuthDiscordService {
  discordApiUrl = 'https://discord.com/api';
  scope = ['identify', 'email', 'guilds.members.read'];

  constructor(private configService: ConfigService<AppConfiguration>, private readonly httpService: HttpService) {}

  private async exchangeTokens(code: string, connect: boolean = false) {
    const { clientID, clientSecret, callbackURL } = this.configService.get('discord', { infer: true });

    const { data } = await firstValueFrom(
      this.httpService.request<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
        scopes: string;
      }>({
        url: `${this.discordApiUrl}/oauth2/token`,
        method: 'POST',
        data: new URLSearchParams({
          client_id: clientID,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: callbackURL + (connect ? '/connect' : '/login'),
          // scope: 'identify email guilds.members.read'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip,deflate,compress',
        },
      }),
    ).catch((e) => {
      if (e instanceof AxiosError) {
        throw new HttpException(e.response?.data, e.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
      }

      throw e;
    });

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      scopes: data.scopes,
      tokenType: data.token_type,
    };
  }
  private async getUserInfo(accessToken: string) {
    const authorization = `Bearer ${accessToken}`;

    const { data } = await firstValueFrom(
      this.httpService.request<{
        id: string;
        username: string;
        avatar: string;
        discriminator: string;
        banner: string;
        email: string;
        verified: boolean;
      }>({
        url: `${this.discordApiUrl}/users/@me`,
        headers: {
          authorization,
          'Accept-Encoding': 'gzip,deflate,compress',
        },
      }),
    );

    return data;
  }

  async getProfileByCode(loginDto: AuthDiscordLoginDto, connect: boolean = false) {
    const tokens = await this.exchangeTokens(loginDto.code, connect);
    const profile = await this.getUserInfo(tokens.accessToken);

    return {
      ...tokens,
      ...profile,
    };
  }
}
