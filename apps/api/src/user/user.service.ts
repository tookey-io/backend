import { Injectable } from '@nestjs/common';
import { UserRepository } from '@tookey/database';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  getOne(params) {
    return this.users.findOne(params);
  }

  updateOne(id, params) {
    return this.users.findOneBy(params);
  }
}
