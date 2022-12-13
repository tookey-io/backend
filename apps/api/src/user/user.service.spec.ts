import { getLoggerToken } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { User, UserRepository, UserTelegramRepository } from '@tookey/database';

import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let userRepositoryMock: DeepMocked<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getLoggerToken(UserService.name), useValue: {} },
        { provide: DataSource, useValue: createMock<DataSource>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: UserTelegramRepository, useValue: createMock<UserTelegramRepository>() },
      ],
    }).compile();
    userService = await module.get(UserService);
    userRepositoryMock = await module.get(UserRepository);
  });

  describe('when getting a user by id', () => {
    describe('and user is matched', () => {
      let user: User;
      beforeEach(() => {
        user = new User();
        user.id = 1;
        userRepositoryMock.findOne.mockResolvedValue(user);
      });

      it('should return user', async () => {
        expect(await userService.getUser({ id: 1 })).toEqual(user);
      });
    });

    describe('and user is not matched', () => {
      beforeEach(() => {
        userRepositoryMock.findOne.mockReturnValue(null);
      });

      it('should return null', async () => {
        expect(await userService.getUser({ id: 1 })).toEqual(null);
      });
    });
  });
});
