import { compareDesc } from 'date-fns';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { PermissionService } from '../permission/permission.service';
import { UserContextDto } from '../user/user.dto';

@Injectable()
export class ShareableKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'shareable-key') {
  constructor(readonly permissionService: PermissionService) {
    super(
      { header: 'X-SHAREABLE-KEY' },
      true,
      async (apikey: string, done: (err: Error | null, user?: UserContextDto) => void) => {
        const token = await permissionService.getPermissionToken(apikey);
        if (!token) return done(new UnauthorizedException('Token is not valid'));
        if (token.validUntil && compareDesc(token.validUntil, new Date()) > 0) {
          return done(new UnauthorizedException('Token is not valid'));
        }
        const keys = token.keys.map(({ publicKey }) => publicKey);
        const permissions = token.permissions.map(({ code }) => code);
        return done(null, { id: 0, keys, permissions });
      },
    );
  }
}
