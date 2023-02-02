import { Injectable } from '@nestjs/common';
import { KeyRepository, SignRepository, UserDiscordRepository } from '@tookey/database';

import { UserDto } from '../user/user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly signs: SignRepository,
    private readonly keys: KeyRepository,
    private readonly userDiscord: UserDiscordRepository,
  ) {}

  async removeUserData(id: number): Promise<UserDto | null> {
    const user = await this.userService.getUser({ id });
    if (!user) return null;
    const discordUser = await this.userDiscord.findOneBy({ userId: id });
    if (discordUser) await this.userDiscord.delete({ id: discordUser.id });
    const keys = await this.keys.findBy({ userId: id });
    if (keys.length) {
      for (const key of keys) {
        await this.signs.delete({ keyId: key.id });
        await this.keys.delete({ id: key.id });
      }
    }
  }
}
