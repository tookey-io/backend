import * as crypto from 'crypto';
import { addMilliseconds } from 'date-fns';
import { MoreThan } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, AccessTokenRepository } from '@tookey/database';

import { AccessConfig } from './access.types';

@Injectable()
export class AccessService {
  constructor(
    private readonly config: ConfigService<AccessConfig>,
    private readonly accessTokens: AccessTokenRepository,
  ) {}

  async getAccessToken(userId: number): Promise<AccessToken> {
    const found = await this.accessTokens.findOneBy({ userId, validUntil: MoreThan(new Date()) });
    if (found) return found;

    return this.refreshToken(userId);
  }

  async getTokenUserId(token: string): Promise<number | null> {
    const found = await this.accessTokens.findOne({ where: { token, validUntil: MoreThan(new Date()) } });
    if (!found) return null;
    return found.userId;
  }

  async isValidToken(token: string): Promise<boolean> {
    const count = await this.accessTokens.countBy({ token });
    return count > 0;
  }

  async refreshToken(userId: number): Promise<AccessToken> {
    const accessToken = this.accessTokens.create({
      userId,
      token: crypto.randomBytes(32).toString('hex'),
      validUntil: addMilliseconds(new Date(), this.config.get('defaultTtl', { infer: true })),
    });
    await this.accessTokens.delete({ userId });
    return await this.accessTokens.createOrUpdateOne(accessToken);
  }
}
