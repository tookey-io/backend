import { Injectable } from '@nestjs/common';
import { AccessService } from '@tookey/access';
import { AofgProfileRepository, KeyRepository, SignRepository, User, UserDiscordRepository } from '@tookey/database';
import { AuthTokenDto } from '../auth/auth.dto';

import { UserDto } from '../user/user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AdminService {
  getUserOtp(userId: number) {
    return this.accessService.getAccessToken(userId);
  }
  
  constructor(
    private readonly userService: UserService,
    private readonly signs: SignRepository,
    private readonly keys: KeyRepository,
    private readonly userDiscord: UserDiscordRepository,
    private readonly aofgProfile: AofgProfileRepository,
    private readonly accessService: AccessService
  ) {}

  async removeUserData(id: number): Promise<UserDto | null> {
    const user = await this.userService.getUser({ id });
    if (!user) return null;
    const discordUser = await this.userDiscord.findOneBy({ userId: id });
    if (discordUser) await this.userDiscord.delete({ id: discordUser.id });
    const aofgProfile = await this.aofgProfile.findOneBy({ userId: id });
    if (aofgProfile) await this.aofgProfile.delete({ id: aofgProfile.id });
    const keys = await this.keys.findBy({ userId: id });
    if (keys.length) {
      for (const key of keys) {
        await this.signs.delete({ keyId: key.id });
        await this.keys.delete({ id: key.id });
      }
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }
}
