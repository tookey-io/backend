import * as crypto from 'crypto';
import { addMilliseconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { In } from 'typeorm';

import { BadRequestException, Injectable } from '@nestjs/common';
import { PermissionRepository, PermissionTokenRepository, UserPermissionTokenRepository } from '@tookey/database';

import { KeysService } from '../keys/keys.service';
import { PermissionDto, PermissionTokenCreateRequestDto, PermissionTokenDto } from './permission.dto';

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
    const validUntil = dto.ttl ? addMilliseconds(new Date(), dto.ttl) : null;
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

  async getPermissionsByUser(userId: number): Promise<Record<string, PermissionDto>> {
    const userPermissionTokens = await this.userPermissionTokenRepository.find({
      where: { userId },
      relations: { permissionToken: { permissions: true } },
    });

    return userPermissionTokens.reduce((acc, userToken) => {
      return {
        ...acc,
        ...userToken.permissionToken.keys.map(({ publicKey }) => ({
          [publicKey]: userToken.permissionToken.permissions,
        })),
      };
    }, {});
  }
}
