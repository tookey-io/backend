import { KeyEvent } from 'apps/api/src/api.events';
import { PinoLogger, getLoggerToken } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AmqpService } from '@tookey/amqp';
import { Key, KeyParticipantRepository, KeyRepository, SignRepository } from '@tookey/database';

import { UserService } from '../user/user.service';
import { KeyCreateRequestDto } from './keys.dto';
import { KeysService } from './keys.service';

describe('KeysService', () => {
  let keysService: KeysService;
  let keysRepositoryMock: DeepMocked<KeyRepository>;
  let userServiceMock: DeepMocked<UserService>;
  let eventEmitterMock: DeepMocked<EventEmitter2>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        KeysService,
        { provide: getLoggerToken(KeysService.name), useValue: createMock<PinoLogger>() },
        { provide: DataSource, useValue: createMock<DataSource>() },
        { provide: AmqpService, useValue: createMock<AmqpService>() },
        { provide: KeyRepository, useValue: createMock<KeyRepository>() },
        { provide: KeyParticipantRepository, useValue: createMock<KeyParticipantRepository>() },
        { provide: SignRepository, useValue: createMock<SignRepository>() },
        { provide: UserService, useValue: createMock<UserService>() },
        { provide: EventEmitter2, useValue: createMock<EventEmitter2>() },
      ],
    }).compile();
    keysService = await module.get(KeysService);
    keysRepositoryMock = module.get(KeyRepository);
    userServiceMock = module.get(UserService);
    eventEmitterMock = module.get(EventEmitter2);
  });

  describe('when creating a key', () => {
    const keyCreateRequestDto: KeyCreateRequestDto = {
      participantsCount: 3,
      participantsThreshold: 2,
    };
    let userKeysCount = 2;
    beforeEach(() => {
      keysRepositoryMock.countBy.mockResolvedValue(userKeysCount);
      userServiceMock.getUser.mockResolvedValue({ id: 1, keyLimit: 5, fresh: true, lastInteraction: new Date() });
    });

    describe('and key creation approved', () => {
      beforeEach(() => {
        eventEmitterMock.waitFor.mockResolvedValue([{ isApproved: true }]);
        keysRepositoryMock.createOrUpdateOne.mockResolvedValue({ id: 1, participantIndex: 1 } as Key);
        keysRepositoryMock.findOne.mockResolvedValue({
          id: 1,
          participantIndex: 1,
          participants: [],
        } as Key);
      });
      it('should receive approve callback from bot', async () => {
        const approve = await keysService.waitForApprove(KeyEvent.CREATE_RESPONSE, 'uuid');
        expect(approve).toEqual(true);
      });
      it('should return a new key', async () => {
        const newKey = await keysService.createKey(keyCreateRequestDto, 1);
        expect(newKey.id).toEqual(1);
      });
    });

    describe('and key creation rejected', () => {
      beforeEach(() => {
        eventEmitterMock.waitFor.mockResolvedValue([{ isApproved: false }]);
      });
      it('should fail with "Rejected by user"', async () => {
        try {
          await keysService.createKey(keyCreateRequestDto, 1);
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(error.message).toBe('Rejected by user');
        }
      });
    });

    describe('and user not provided', () => {
      beforeEach(() => {
        userServiceMock.getUser.mockResolvedValue(null);
      });
      it('should fail with "User not found"', async () => {
        try {
          await keysService.createKey(keyCreateRequestDto, null);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toBe('User not found');
        }
      });
    });

    describe('and user keys limit reached', () => {
      beforeEach(() => {
        userKeysCount = 5;
        keysRepositoryMock.countBy.mockResolvedValue(userKeysCount);
      });
      it('should fail with "Keys limit reached"', async () => {
        try {
          await keysService.createKey(keyCreateRequestDto, 1);
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(error.message).toBe('Keys limit reached');
        }
      });
    });
  });
});
