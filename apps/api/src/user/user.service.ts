import { Injectable } from '@nestjs/common';
import { UserRepository } from '@tookey/database';

import { UserDto, UserRequestDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async getUser(dto: UserRequestDto): Promise<UserDto> {
    const user = await this.users.findOne({ where: dto });
    return new UserDto(user);
  }
}
