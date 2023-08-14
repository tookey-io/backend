import { AppConfiguration } from 'apps/app/src/app.config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { UserContextDto } from '../../user/user.dto';
import { UserService } from '../../user/user.service';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'ws-jwt') {
  constructor(
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly userService: UserService,
  ) {
    const jwt = configService.get('jwt', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.secret,
    });
  }

  async validate(payload: UserContextDto) {
    return this.userService.getUser({ id: payload.id });
  }
}
