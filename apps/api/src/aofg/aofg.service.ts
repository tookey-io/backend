import { plainToClass } from 'class-transformer';
import { ethers } from 'ethers';
import { getAddress } from 'nestjs-ethers';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { Injectable } from '@nestjs/common';
import { AofgProfileRepository } from '@tookey/database';

import { DiscordService } from '../discord/discord.service';
import { WalletService } from '../wallet/wallet.service';
import { AofgBot } from './aofg.bot';
import { AofgProfileDto, GetOrCreateAofgProfileDto } from './aofg.dto';

const ROLES_MAP = {
  '1063414695995912242': 'Land Lord',
  '1063414317770362900': 'Adventurer',
  '1063415019200593930': 'Crafter',
};

const LEVEL_MAP = {
  '1063413457082392617': 'Novice',
  '1063422213518270544': 'Amateur',
  '1063422557895794710': 'Advanced',
  '1063422589181120522': 'Master',
  '1063422613164134461': 'Legendary',
};

@Injectable()
export class AofgService {
  guildId: string;

  constructor(
    @InjectPinoLogger(AofgService.name) private readonly logger: PinoLogger,
    private readonly bot: AofgBot,
    private readonly aofgProfiles: AofgProfileRepository,
    private readonly discordService: DiscordService,
    private readonly walletService: WalletService,
  ) {
    this.guildId = process.env.DISCORD_GUILD;
  }

  async getOrCreateProfile(dto: GetOrCreateAofgProfileDto): Promise<AofgProfileDto> {
    const discord = await this.discordService.checkGuildMembership(dto.userId, this.guildId);
    const levels = discord.roles.filter((l) => Object.keys(LEVEL_MAP).includes(l)).map((l) => LEVEL_MAP[l]);
    const roles = discord.roles.filter((r) => Object.keys(ROLES_MAP).includes(r)).map((r) => ROLES_MAP[r]);
    const wallet = await this.walletService.getWalletTss(dto.userId);

    const multisigAddress = wallet
      ? ethers.utils
          .computeAddress('0x' + wallet.address)
          .replace('0x', '')
          .toLowerCase()
      : undefined;

    console.log({
      levels,
      roles,
      multisigAddress,
    });

    const profile = await this.aofgProfiles.createOrUpdateOne({
      userId: dto.userId,
      title: this.bot.getUserTitle(discord.roles),
      name: discord.username,
      multisigAddress,
    });

    const aofgProfile: AofgProfileDto = {
      ...plainToClass(AofgProfileDto, profile, { excludeExtraneousValues: true }),
    };

    if (aofgProfile.multisigAddress) {
      aofgProfile.multisigAddress = wallet.address;
      aofgProfile.wallet = {
        address: getAddress('0x' + profile.multisigAddress),
        balance: 0,
        staked: 0,
        totalStaked: 0,
      };
    }

    return aofgProfile;
  }

  // async updateProfile(dto: UpdateAofgProfileDto) {}
}
