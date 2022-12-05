import * as crypto from 'crypto';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { In } from 'typeorm';

import { BadRequestException, Injectable } from '@nestjs/common';
import { PermissionRepository, ShareableTokenRepository } from '@tookey/database';

import { KeysService } from '../keys/keys.service';
import { ShareableTokenCreateRequestDto, ShareableTokenDto } from './shareable-token.dto';

@Injectable()
export class ShareableTokenService {
  constructor(
    @InjectPinoLogger(ShareableTokenService.name) private readonly logger: PinoLogger,
    private readonly keysService: KeysService,
    private readonly permissionRepository: PermissionRepository,
    private readonly shareableTokenRepository: ShareableTokenRepository,
  ) {}

  async createShareableToken(userId: number, dto: ShareableTokenCreateRequestDto): Promise<ShareableTokenDto> {
    const validUntil = dto.ttl ? addSeconds(new Date(), dto.ttl) : null;
    const keys = await this.keysService.getKeyList(userId);
    const keyIds = keys.items.reduce<{ id: number; publicKey: string }[]>((acc, cur) => {
      if (!dto.keys.includes(cur.publicKey)) return acc;
      return [...acc, { id: cur.id, publicKey: cur.publicKey }];
    }, []);
    if (!keyIds.length) throw new BadRequestException('Provided keys not found');
    const permissions = await this.permissionRepository.findBy({
      code: dto.permissions ? In(dto.permissions) : undefined,
    });
    const shareableTokenEntity = this.shareableTokenRepository.create({
      userId,
      token: crypto.randomBytes(32).toString('hex'),
      keys: keyIds,
      permissions,
      validUntil,
    });
    const shareableToken = await this.shareableTokenRepository.createOrUpdateOne(shareableTokenEntity);
    return new ShareableTokenDto({
      ...shareableToken,
      keys: keyIds.map(({ publicKey }) => publicKey),
    });
  }

  async getShareableTokensByUser(userId: number): Promise<ShareableTokenDto[]> {
    const tokens = await this.shareableTokenRepository.find({
      where: { userId },
      relations: { keys: true, permissions: true },
    });

    return tokens.map((token) => ({
      ...token,
      keys: token.keys.map(({ publicKey }) => publicKey),
    }));
  }

  async getShareableToken(token: string) {
    return await this.shareableTokenRepository.findOne({
      where: { token },
      relations: { keys: true, permissions: true },
    });
  }
}
