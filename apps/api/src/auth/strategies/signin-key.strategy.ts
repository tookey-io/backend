import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccessService } from '@tookey/access';

import { UserContextDto } from '../../user/user.dto';
import { UserService } from '../../user/user.service';

@Injectable()
export class SigninKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'signin-key') {
  constructor(readonly accessService: AccessService, readonly userService: UserService) {
    super(
      { header: 'X-SIGNIN-KEY' },
      true,
      async (apikey: string, done: (err: Error | null, user?: UserContextDto) => void) => {
        const userId = await accessService.getTokenUserId(apikey);
        const user = await userService.getUser({ id: userId });
        if (!userId) return done(new UnauthorizedException('Token is not valid'));
        return done(null, { id: userId, user, roles: [] });
      },
    );
  }
}
