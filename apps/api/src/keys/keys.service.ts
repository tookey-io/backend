import { randomUUID } from 'crypto';
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
  KeyCreateEventResponseDto,
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeyGetRequestDto,
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

  async sendCreateApprove(
    dto: KeyCreateRequestDto,
    userId: number,
  ): Promise<KeyDto> {
    const user = await this.users.getUser({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    await this.checkUserLimits(user);

    this.eventEmitter.emit(KeyEvent.CREATE_REQUEST, dto, userId);

    return await this.eventEmitter
      .waitFor(KeyEvent.CREATE_RESPONSE, {
        handleError: false,
        timeout: dto.timeoutSeconds * 1000,
        filter: (data: KeyCreateEventResponseDto) => data.userId === userId,
        Promise,
        overload: false,
      })
      .then(([{ decision }]: [KeyCreateEventResponseDto]) => {
        if (decision === 'approve') return this.create(dto, userId);
        if (decision === 'reject') throw new Error(decision);
        throw new Error();
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

  async create(dto: KeyCreateRequestDto, userId: number): Promise<KeyDto> {
    const user = await this.users.getUser({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    await this.checkUserLimits(user);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const entityManager = queryRunner.manager;

    try {
      const { id, participantIndex } = await this.keys.createOrUpdateOne(
        {
          user,
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
          userId: user.id,
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
        user_id: `${user.id}`,
        room_id: key.roomId,
        key_id: `${key.id}`,
        participant_index: key.participantIndex,
        participants_count: key.participantsCount,
        participants_threshold: key.participantsThreshold - 1,
        timeout_seconds: key.timeoutSeconds,
      });

      const newKey = new KeyDto({
        ...key,
        participants: participants.map((participant) => participant.index),
      });

      this.eventEmitter.emit('key.create.done', newKey);

      return newKey;
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

  async sign(dto: KeySignRequestDto, userId?: number): Promise<SignDto> {
    const key = await this.keys.findOneBy({ id: dto.keyId, userId });
    if (!key) throw new NotFoundException('Key not found');

    const { id } = await this.signs.createOrUpdateOne({
      key,
      roomId: randomUUID(),
      data: dto.data,
      metadata: dto.metadata,
      participantsConfirmations: dto.participantsConfirmations,
      timeoutAt: new Date(),
    });

    const sign = await this.signs.findOneBy({ id });

    this.amqp.publish<AmqpSignApproveDto>('amq.topic', 'manager', {
      action: 'sign_approve',
      user_id: `${sign.key.userId}`,
      room_id: sign.roomId,
      key_id: `${sign.key.id}`,
      participants_indexes: sign.participantsConfirmations,
      data: sign.data,
      timeout_seconds: sign.key.timeoutSeconds,
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
