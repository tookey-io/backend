import { AppConfiguration } from 'apps/app/src/app.config';
import { Profile, Strategy } from 'passport-discord';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { DiscordService } from '../../discord/discord.service';
import { UserContextDto } from '../../user/user.dto';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly discordService: DiscordService,
  ) {
    const discord = configService.get('discord', { infer: true });
    super({
      ...discord,
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: UserContextDto) => void,
  ) {
    const { id: discordId, email, username, discriminator, avatar, locale, verified } = profile;
    let discordUser = await this.discordService.getUser({ discordId }, null);
    const discordTag = `${username}#${discriminator}`;

    if (!discordUser) {
      discordUser = await this.discordService.createDiscordUser({
        discordId,
        discordTag,
        email,
        avatar,
        locale,
        verified,
        accessToken,
        refreshToken,
      });
    } else {
      discordUser = await this.discordService.updateUser(
        discordUser.id,
        {
          discordId,
          discordTag,
          email,
          avatar,
          locale,
          verified,
          accessToken,
          refreshToken,
        },
        null,
      );
    }
    done(null, { id: discordUser.userId });
  }
}
