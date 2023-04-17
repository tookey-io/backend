import { ClassSerializerInterceptor, Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { DiscordGuildMembershipRequestDto, DiscordGuildMembershipResponseDto } from './discord.dto';
import { DiscordService } from './discord.service';

@Controller('api/discord')
@ApiTags('Discord')
@UseInterceptors(ClassSerializerInterceptor)
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}

  @JwtAuth()
  @Get('me')
  getUser(@CurrentUser() user: UserContextDto) {
    return this.discordService.getUser({ userId: user.id });
  }

  @JwtAuth()
  @Get('membership')
  guildMembership(
    @CurrentUser() user: UserContextDto,
    @Query() data: DiscordGuildMembershipRequestDto,
  ): Promise<DiscordGuildMembershipResponseDto> {
    return this.discordService.checkGuildMembership(user.id, data.guild);
  }
}
