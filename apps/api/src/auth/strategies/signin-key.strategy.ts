import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccessService } from '@tookey/access';

import { UserContextDto } from '../../user/user.dto';

@Injectable()
export class SigninKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'signin-key') {
  constructor(readonly accessService: AccessService) {
    super(
      { header: 'X-SIGNIN-KEY' },
      true,
      async (apikey: string, done: (err: Error | null, user?: UserContextDto) => void) => {
        const userId = await accessService.getTokenUserId(apikey);
        if (!userId) return done(new UnauthorizedException('Token is not valid'));
        return done(null, { id: userId });
      },
    );
  }
}
