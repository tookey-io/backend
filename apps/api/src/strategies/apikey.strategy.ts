import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccessService } from '@tookey/access';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(readonly accessService: AccessService) {
    super(
      { header: 'apiKey', prefix: '' },
      true,
      async (
        apikey: string,
        done: (err: Error | null, result?: boolean) => void,
      ) => done(null, await accessService.isValidToken(apikey)),
    );
  }
}
