import { compareDesc } from 'date-fns';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ShareableTokenService } from '../../shareable-token/shareable-token.service';
import { UserContextDto } from '../../user/user.dto';

@Injectable()
export class ShareableKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'shareable-key') {
  constructor(readonly shareableTokenService: ShareableTokenService) {
    super(
      { header: 'X-SHAREABLE-KEY' },
      true,
      async (apikey: string, done: (err: Error | null, user?: UserContextDto) => void) => {
        const shareableToken = await shareableTokenService.getShareableToken(apikey);
        if (!shareableToken) return done(new UnauthorizedException('Token is not valid'));
        if (shareableToken.validUntil && compareDesc(shareableToken.validUntil, new Date()) > 0) {
          return done(new UnauthorizedException('Token is not valid'));
        }
        const keys = shareableToken.keys.map(({ publicKey }) => publicKey);
        const permissions = shareableToken.permissions.map(({ code }) => code);
        return done(null, { id: 0, keys, permissions });
      },
    );
  }
}
