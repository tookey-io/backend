import { formatISO } from 'date-fns';

import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessService } from '@tookey/access';

import { AccessTokenResponseDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly accessService: AccessService) {}

  async getAccessToken(userId: number): Promise<AccessTokenResponseDto> {
    const accessToken = await this.accessService.getAccessToken(userId);
    if (!accessToken) throw new NotFoundException('Token not found');
    return {
      token: accessToken.token,
      validUntil: formatISO(accessToken.validUntil),
    };
  }
}
