import { randomUUID } from 'crypto';
import { addSeconds } from 'date-fns';
import { DataSource } from 'typeorm';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AmqpService } from '@tookey/amqp';
import {
  KeyParticipantRepository,
  KeyRepository,
  SignRepository,
  TaskStatus,
} from '@tookey/database';

import { UserDto } from '../user/user.dto';
import { UserService } from '../user/user.service';
import {
  AmqpKeygenJoinDto,
  AmqpPayloadDto,
  AmqpSignApproveDto,
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeyEventResponseDto,
  KeyGetRequestDto,
  KeySignEventRequestDto,
  KeySignRequestDto,
  SignDto,
} from './keys.dto';
import { KeyEvent } from './keys.types';

@Injectable()
export class KeyService {
  private readonly logger = new Logger(KeyService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly amqp: AmqpService,
    private readonly keys: KeyRepository,
    private readonly participants: KeyParticipantRepository,
    private readonly signs: SignRepository,
    private readonly users: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createKey(dto: KeyCreateRequestDto, userId: number): Promise<KeyDto> {
    const user = await this.users.getUser({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    await this.checkUserLimits(user);

    this.eventEmitter.emit(KeyEvent.CREATE_REQUEST, dto, userId);

    return await this.eventEmitter
      .waitFor(KeyEvent.CREATE_RESPONSE, {
        handleError: false,
        timeout: dto.timeoutSeconds * 1000,
        filter: (data: KeyEventResponseDto) => data.userId === userId,
        Promise,
        overload: false,
      })
      .then(([{ isApproved }]: [KeyEventResponseDto]) => {
        if (isApproved) return this.saveKey(dto, userId);
        throw new Error('reject');
      })
      .catch((error) => {
        if (error.message === 'reject') {
          throw new ForbiddenException('Rejected by user');
        }
        if (error.message === 'timeout') {
          throw new RequestTimeoutException('Rejected by user');
        }
        this.logger.error(error);
        throw new InternalServerErrorException(error.message);
      });
  }

  async saveKey(dto: KeyCreateRequestDto, userId: number): Promise<KeyDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const { id, participantIndex } = await this.keys.createOrUpdateOne(
        {
          userId,
          roomId: randomUUID(),
          participantsCount: dto.participantsCount,
          participantsThreshold: dto.participantsThreshold,
          timeoutSeconds: dto.timeoutSeconds,
          name: dto.name,
          description: dto.description,
          tags: dto.tags,
        },
        entityManager,
      );

      await this.participants.createOrUpdateOne(
        {
          keyId: id,
          userId,
          index: participantIndex,
        },
        entityManager,
      );

      await queryRunner.commitTransaction();

      const { participants, ...key } = await this.keys.findOne({
        where: { id },
        relations: { participants: true },
      });

      this.amqp.publish<AmqpKeygenJoinDto>('amq.topic', 'manager', {
        action: 'keygen_join',
        user_id: `${userId}`,
        room_id: key.roomId,
        key_id: `${key.id}`,
        participant_index: key.participantIndex,
        participants_count: key.participantsCount,
        participants_threshold: key.participantsThreshold - 1,
        timeout_seconds: key.timeoutSeconds,
      });

      return new KeyDto({
        ...key,
        participants: participants.map((participant) => participant.index),
      });
    } catch (error) {
      queryRunner.isTransactionActive &&
        (await queryRunner.rollbackTransaction());
      this.logger.error('create key transaction', error);
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async checkUserLimits(user: UserDto): Promise<void> {
    const userKeysCount = await this.keys.countBy({ userId: user.id });
    if (userKeysCount >= user.keyLimit) {
      throw new ForbiddenException('Keys limit reached');
    }
  }

  async getKey(dto: KeyGetRequestDto, userId?: number): Promise<KeyDto> {
    const key = await this.keys.findOne({
      where: { ...dto, userId },
      relations: { participants: true },
    });
    if (!key) throw new NotFoundException('Key not found');

    const { participants, ...keyProps } = key;

    return new KeyDto({
      ...keyProps,
      participants: participants.map((participant) => participant.index),
    });
  }

  async getKeys(userId?: number): Promise<KeyDto[]> {
    const keys = await this.keys.find({
      where: { userId },
      relations: { participants: true },
    });
    if (!keys.length) throw new NotFoundException('Keys not found');

    return keys.map((key) => {
      const { participants, ...keyProps } = key;

      return new KeyDto({
        ...keyProps,
        participants: participants.map((participant) => participant.index),
      });
    });
  }

  async delete(
    dto: KeyDeleteRequestDto,
    userId?: number,
  ): Promise<KeyDeleteResponseDto> {
    const { affected } = await this.keys.delete({ id: dto.id, userId });
    return { affected };
  }

  async signKey(dto: KeySignRequestDto, userId?: number): Promise<SignDto> {
    const key = await this.keys.findOneBy({ publicKey: dto.publicKey, userId });
    if (!key) throw new NotFoundException('Key not found');

    const signEventDto: KeySignEventRequestDto = {
      ...dto,
      keyId: key.id,
      timeoutSeconds: key.timeoutSeconds,
    };

    this.eventEmitter.emit(KeyEvent.SIGN_REQUEST, signEventDto, userId);

    return await this.eventEmitter
      .waitFor(KeyEvent.SIGN_RESPONSE, {
        handleError: false,
        timeout: key.timeoutSeconds * 1000,
        filter: (data: KeyEventResponseDto) => data.userId === userId,
        Promise,
        overload: false,
      })
      .then(([{ isApproved }]: [KeyEventResponseDto]) => {
        if (isApproved) return this.saveSign(signEventDto, userId);
        throw new Error('reject');
      })
      .catch((error) => {
        if (error.message === 'reject') {
          throw new ForbiddenException('Rejected by user');
        }
        if (error.message === 'timeout') {
          throw new RequestTimeoutException('Rejected by user');
        }
        this.logger.error(error);
        throw new InternalServerErrorException(error.message);
      });
  }

  async saveSign(
    dto: KeySignEventRequestDto,
    userId?: number,
  ): Promise<SignDto> {
    const { id } = await this.signs.createOrUpdateOne({
      keyId: dto.keyId,
      roomId: randomUUID(),
      data: dto.data,
      metadata: dto.metadata,
      participantsConfirmations: dto.participantsConfirmations,
      timeoutAt: addSeconds(new Date(), dto.timeoutSeconds),
    });

    const sign = await this.signs.findOneBy({ id });

    this.amqp.publish<AmqpSignApproveDto>('amq.topic', 'manager', {
      action: 'sign_approve',
      user_id: `${userId}`,
      room_id: sign.roomId,
      key_id: `${dto.keyId}`,
      participants_indexes: sign.participantsConfirmations,
      data: sign.data,
      timeout_seconds: dto.timeoutSeconds,
    });

    return new SignDto(sign);
  }

  async handleKeygenStatusUpdate(payload: AmqpPayloadDto): Promise<void> {
    try {
      const key = await this.keys.findOneBy({ roomId: payload.room_id });

      key.status = payload.status;

      if (key.status === TaskStatus.Started) {
        key.participantsActive = payload.active_indexes;
      }

      if (key.status === TaskStatus.Finished) {
        key.participantsActive = payload.active_indexes;
        key.publicKey = payload.public_key;
      }

      await this.keys.createOrUpdateOne(key);

      this.logger.log('Keygen status update', key.status);
    } catch (error) {
      this.logger.error('Keygen status update fail', error);
    }
  }

  async handleSignStatusUpdate(payload: AmqpPayloadDto): Promise<void> {
    try {
      const sign = await this.signs.findOneBy({ roomId: payload.room_id });

      sign.status = payload.status;

      if (sign.status === TaskStatus.Started) {
        sign.participantsConfirmations = payload.active_indexes;
      }

      if (sign.status === TaskStatus.Finished) {
        sign.participantsConfirmations = payload.active_indexes;
        sign.result = payload.result;
      }

      await this.signs.createOrUpdateOne(sign);

      this.logger.log('Sign status update', sign.status);
    } catch (error) {
      this.logger.error('Sign status update fail', error);
    }
  }
}
