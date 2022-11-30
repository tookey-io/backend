import { AppConfiguration } from 'apps/app/src/app.config';
import { addSeconds, formatISO } from 'date-fns';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessService } from '@tookey/access';

import { AuthTokenDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly accessService: AccessService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  async getAccessToken(userId: number): Promise<AuthTokenDto> {
    const accessToken = await this.accessService.getAccessToken(userId);
    if (!accessToken) throw new NotFoundException('Access token not found');
    return {
      token: accessToken.token,
      validUntil: formatISO(accessToken.validUntil),
    };
  }

  public getJwtAccessToken(userId: number): AuthTokenDto {
    const jwt = this.configService.get('jwt', { infer: true });
    const token = this.jwtService.sign(
      { id: userId },
      {
        secret: jwt.accessTokenSecret,
        expiresIn: jwt.accessTokenTTL,
      },
    );
    return {
      token,
      validUntil: formatISO(addSeconds(new Date(), jwt.accessTokenTTL)),
    };
  }

  public getJwtRefreshToken(userId: number) {
    const jwt = this.configService.get('jwt', { infer: true });
    const token = this.jwtService.sign(
      { id: userId },
      {
        secret: jwt.refreshTokenSecret,
        expiresIn: jwt.refreshTokenTTL,
      },
    );
    return {
      token,
      validUntil: formatISO(addSeconds(new Date(), jwt.refreshTokenTTL)),
    };
  }
}
