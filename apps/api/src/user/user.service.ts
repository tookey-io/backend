import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { Injectable } from '@nestjs/common';
import { UserRepository, UserTelegramRepository } from '@tookey/database';

import { UserDto, UserRequestDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly users: UserRepository,
    private readonly telegramUsers: UserTelegramRepository,
  ) {}

  async getUser(dto: UserRequestDto): Promise<UserDto> {
    const user = await this.users.findOne({ where: dto });
    return new UserDto(user);
  }
}
