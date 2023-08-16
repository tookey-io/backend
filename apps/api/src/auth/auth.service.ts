import { AppConfiguration } from 'apps/app/src/app.config';
import { addSeconds, formatISO } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthTokenDto, PricipalDto } from './auth.dto';
import { classToPlain, instanceToPlain, plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  public validateToken(token: string) {
    const jwt = this.configService.get('jwt', { infer: true });
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Access Token configuration');

    return this.jwtService
      .verifyAsync<PricipalDto>(token, {
        secret: jwt.secret,
      })
      .then((plain) => plainToInstance(PricipalDto, plain));
  }

  private getJwtToken(principal: PricipalDto, secret: string, ttl: number) {
    try {
      const token = this.jwtService.sign(principal, {
        secret: secret,
        expiresIn: ttl,
      });
      return {
        token,
        validUntil: formatISO(addSeconds(new Date(), ttl)),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  public getJwtAdminToken(key: string) {
    const jwt = this.configService.get('jwt', { infer: true });
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Access Token configuration');
    if (jwt.secret !== key) throw new UnauthorizedException('Invalid admin key');

    return this.getJwtToken({ id: -1, roles: ['admin'] }, jwt.secret, 60 * 60 * 24 * 365); // 1 year
  }

  public getJwtServiceToken(principal: PricipalDto) {
    const plain = instanceToPlain(principal) as PricipalDto;
    plain.roles.push('service');
    const jwt = this.configService.get('jwt', { infer: true });
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Access Token configuration');
    return this.getJwtToken(plain, jwt.secret, 60 * 60 * 24 * 365); // 1 year
  }

  public getJwtAccessToken(principal: PricipalDto) {
    const plain = instanceToPlain(principal) as PricipalDto;
    plain.roles.push('access');
    const jwt = this.configService.get('jwt', { infer: true });
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Access Token configuration');
    return this.getJwtToken(plain, jwt.secret, jwt.accessTokenTTL);
  }

  public getJwtRefreshToken(principal: PricipalDto) {
    const plain = instanceToPlain(principal) as PricipalDto;
    plain.roles.push('refresh');
    const jwt = this.configService.get('jwt', { infer: true });
    if (!jwt) throw new InternalServerErrorException('Invalid JWT Refresh Token configuration');

    return this.getJwtToken(plain, jwt.secret, jwt.refreshTokenTTL);
  }
}
