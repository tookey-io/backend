import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessTokenRepository } from '@tookey/database/entities/token.entity';
import { User } from '@tookey/database/entities/user.entity';
import * as crypto from 'crypto';
import { AccessConfig } from './access.types';

@Injectable()
export class AccessService {
    constructor(
        private readonly config: ConfigService<AccessConfig>,
        private readonly tokens: AccessTokenRepository
    ) {}

    async getAccessToken(user: User) {
        const found = await this.tokens.getByUserId(user.id)
        if (found && found.validUntil.getTime() > Date.now()) {
            return found
        } else {
            const token = crypto.randomBytes(32).toString('hex')
            const accessToken = this.tokens.create({
                token,
                user,
                validUntil: Date.now() + this.config.get("defaultTtl", { infer: true })
            })

            return accessToken
        }
    }
}
