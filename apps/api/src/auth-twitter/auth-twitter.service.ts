import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AppConfiguration } from 'apps/app/src/app.config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import { addSeconds } from 'date-fns';

export class AuthTwitterLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  codeVerifier: string;
}

@Injectable()
export class AuthTwitterService {
  constructor(private configService: ConfigService<AppConfiguration>, private readonly httpService: HttpService) {
  }

  private async exchangeTokens({code, codeVerifier}: AuthTwitterLoginDto, connect: boolean = false) {
    const { clientId, clientSecret, callbackUrl } = this.configService.get('twitter', { infer: true });
    console.log({
      method: 'exchangeTokens',
      clientId,
      clientSecret,
      callbackUrl,
      connect
    });

    return new TwitterApi({ clientId, clientSecret }).loginWithOAuth2({ code, codeVerifier, redirectUri: callbackUrl + (connect ? '/connect' : '/login') }).catch(e => {
      console.log(e)
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    });
  }

  private async getUserInfo(client: TwitterApi) {
    return client.v2.me().catch(e => {
      console.log(e)
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    });
  }

  async getProfileByCode(loginDto: AuthTwitterLoginDto, connect: boolean = false) {
    const tokens = await this.exchangeTokens(loginDto, connect);
    const { data: profile } = await this.getUserInfo(tokens.client);

    return {
      ...tokens,
      ...profile,
    };
  }
}
