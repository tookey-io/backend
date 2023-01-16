import { Injectable } from '@nestjs/common';
import { AofgProfileRepository, UserDiscordRepository } from '@tookey/database';
import { plainToClass } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DiscordService } from '../discord/discord.service';
import { AofgBot } from './aofg.bot';
import { AofgProfileDto, GetOrCreateAofgProfileDto } from './aofg.dto';



const ROLES_MAP = {
  '1063414695995912242': 'Land Lord',
  '1063414317770362900': 'Adventurer',
  '1063415019200593930': 'Crafter',
}

const LEVEL_MAP = {
  '1063413457082392617': 'Novice',
  '1063422213518270544': 'Amateur',
  '1063422557895794710': 'Advanced',
  '1063422589181120522': 'Master',
  '1063422613164134461': 'Legendary'
}

@Injectable()
export class AofgService {
  constructor(
    @InjectPinoLogger(AofgService.name) private readonly logger: PinoLogger,
    private readonly bot: AofgBot,
    private readonly aofgProfiles: AofgProfileRepository,
    private readonly discordService: DiscordService,
  ) {}

  async getOrCreateProfile(dto: GetOrCreateAofgProfileDto) : Promise<AofgProfileDto> {
    const discord = await this.discordService.checkGuildMembership(dto.userId, '1062682232810111046');
    const levels = discord.roles.filter(l => Object.keys(LEVEL_MAP).includes(l)).map(l => LEVEL_MAP[l])
    const roles = discord.roles.filter(r => Object.keys(ROLES_MAP).includes(r)).map(r => ROLES_MAP[r])

    console.log({
      levels,
      roles
    })

    await this.discordService.getGuildRoles(dto.userId, '1062682232810111046');
    const profile = await this.aofgProfiles.createOrUpdateOne({
      userId: dto.userId,
      title: this.bot.getUserTitle(discord.roles),
      name: discord.username
    });

    return plainToClass(AofgProfileDto, {
        ...profile
    }, {
        excludeExtraneousValues: true
    })
  }

  // async updateProfile(dto: UpdateAofgProfileDto) {}
}
