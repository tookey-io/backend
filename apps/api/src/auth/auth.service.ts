import { AppConfiguration } from 'apps/app/src/app.config';
import { addSeconds, formatISO } from 'date-fns';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthTokenDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  public getJwtAccessToken(userId: number): AuthTokenDto {
    const jwt = this.configService.get('jwt', { infer: true });
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Access Token configuration');
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
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Refresh Token configuration');
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
