import * as crypto from 'crypto';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { In } from 'typeorm';

import { BadRequestException, Injectable } from '@nestjs/common';
import { PermissionRepository, PermissionTokenRepository, UserPermissionTokenRepository } from '@tookey/database';

import { KeysService } from '../keys/keys.service';
import { PermissionTokenCreateRequestDto, PermissionTokenDto } from './permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectPinoLogger(PermissionService.name) private readonly logger: PinoLogger,
    private readonly keysService: KeysService,
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionTokenRepository: PermissionTokenRepository,
    private readonly userPermissionTokenRepository: UserPermissionTokenRepository,
  ) {}

  async createPermissionToken(userId: number, dto: PermissionTokenCreateRequestDto): Promise<PermissionTokenDto> {
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
    const permissionTokenEntity = this.permissionTokenRepository.create({
      userId,
      token: crypto.randomBytes(32).toString('hex'),
      keys: keyIds,
      permissions,
      validUntil,
    });
    const permissionToken = await this.permissionTokenRepository.createOrUpdateOne(permissionTokenEntity);
    return new PermissionTokenDto({
      ...permissionToken,
      keys: keyIds.map(({ publicKey }) => publicKey),
    });
  }

  async getPermissionTokensByUser(userId: number): Promise<PermissionTokenDto[]> {
    const tokens = await this.permissionTokenRepository.find({
      where: { userId },
      relations: { keys: true, permissions: true },
    });

    return tokens.map((token) => ({
      ...token,
      keys: token.keys.map(({ publicKey }) => publicKey),
    }));
  }

  async getPermissionToken(token: string) {
    return await this.permissionTokenRepository.findOne({
      where: { token },
      relations: { keys: true, permissions: true },
    });
  }
}
