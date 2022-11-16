import * as crypto from 'crypto';
import { addMilliseconds, compareAsc } from 'date-fns';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, AccessTokenRepository, User } from '@tookey/database';

import { AccessConfig } from './access.types';

@Injectable()
export class AccessService {
  constructor(
    private readonly config: ConfigService<AccessConfig>,
    private readonly accessTokens: AccessTokenRepository,
  ) {}

  async getAccessToken(userId: number): Promise<AccessToken> {
    const found = await this.accessTokens.findOneBy({ userId });
    if (found && compareAsc(found.validUntil, new Date())) return found;

    const accessToken = this.accessTokens.create({
      userId,
      token: crypto.randomBytes(32).toString('hex'),
      validUntil: addMilliseconds(new Date(), this.config.get('defaultTtl', { infer: true })),
    });

    await this.accessTokens.createOrUpdateOne(accessToken);

    return accessToken;
  }

  async getTokenUser(token: string): Promise<User | null> {
    const accessToken = await this.accessTokens.findOne({ where: { token }, relations: { user: true } });
    if (!accessToken) return null;
    return accessToken.user;
  }

  async isValidToken(token: string): Promise<boolean> {
    const count = await this.accessTokens.countBy({ token });
    return count > 0;
  }
}
