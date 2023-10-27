import { AppConfiguration } from 'apps/app/src/app.config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { plainToInstance } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserContextDto } from '../../user/user.dto';
import { UserService } from '../../user/user.service';
import { PricipalDto } from '../auth.dto';

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
    }, async (payload: PricipalDto, done: (err: Error | null, user?: UserContextDto) => void) => {
      try {
        const user = await this.verifyPrincipal(payload);
        done(null, user);
      } catch (err) {
        done(err);
      }
    });
  }

  private async verifyPrincipal(payload: PricipalDto) {
    const user = await this.userService.getUser({ id: payload.id });
    if (!user) throw new NotFoundException('User not found');
    this.logger.info(`roles: ${user.toRoles()}, payload: ${JSON.stringify(payload)}`)

    return plainToInstance(UserContextDto, {
      ...payload,
      user
    });
  }
}
