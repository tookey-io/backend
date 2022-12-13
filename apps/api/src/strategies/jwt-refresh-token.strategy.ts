import { AppConfiguration } from 'apps/app/src/app.config';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { UserContextDto } from '../user/user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
  constructor(
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly userService: UserService,
  ) {
    const jwt = configService.get('jwt', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: UserContextDto) {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    return this.userService.getUserIfRefreshTokenMatches(refreshToken, payload.id);
  }
}
