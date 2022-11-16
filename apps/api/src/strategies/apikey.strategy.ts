import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccessService } from '@tookey/access';

import { UserContextDto } from '../user/user.dto';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(readonly accessService: AccessService) {
    super(
      { header: 'apiKey', prefix: '' },
      true,
      async (apikey: string, done: (err: Error | null, user?: UserContextDto) => void) => {
        const user = await accessService.getTokenUser(apikey);
        if (!user) {
          return done(new UnauthorizedException('Token is not valid'));
        }
        return done(null, { id: user.id });
      },
    );
  }
}
