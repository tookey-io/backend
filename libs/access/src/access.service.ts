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
    if (found && compareAsc(found.validUntil, new Date()) > 0) return found;

    return this.refreshToken(userId);
  }

  async getTokenUser(token: string): Promise<User | null> {
    const found = await this.accessTokens.findOne({ where: { token }, relations: { user: true } });
    if (!found) return null;
    if (compareAsc(found.validUntil, new Date()) <= 0) {
      await this.refreshToken(found.userId);
      return null;
    }
    return found.user;
  }

  async isValidToken(token: string): Promise<boolean> {
    const count = await this.accessTokens.countBy({ token });
    return count > 0;
  }

  private async refreshToken(userId: number): Promise<AccessToken> {
    const accessToken = this.accessTokens.create({
      userId,
      token: crypto.randomBytes(32).toString('hex'),
      validUntil: addMilliseconds(new Date(), this.config.get('defaultTtl', { infer: true })),
    });

    return await this.accessTokens.createOrUpdateOne(accessToken);
  }
}
