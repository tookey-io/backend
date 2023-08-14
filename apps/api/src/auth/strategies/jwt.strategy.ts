import { AppConfiguration } from 'apps/app/src/app.config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { UserService } from '../../user/user.service';
import { PricipalDto } from '../auth.dto';
import { UserContextDto } from '../../user/user.dto';
import { plainToInstance } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectPinoLogger(JwtStrategy.name) private readonly logger: PinoLogger,
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly userService: UserService,
  ) {
    const jwt = configService.get('jwt', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwt.secret,
    });
  }

  async validate(payload: PricipalDto) {
    const user = this.userService.getUser({ id: payload.id });
    this.logger.info('roles', { roles: payload.roles })

    return plainToInstance(UserContextDto, {
      ...payload,
      user
    });
  }
}
