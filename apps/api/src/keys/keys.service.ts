import { randomUUID } from 'crypto';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, In, Not } from 'typeorm';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AmqpService } from '@tookey/amqp';
import { KeyParticipantRepository, KeyRepository, SignRepository, TaskStatus } from '@tookey/database';

import { AmqpKeygenJoinDto, AmqpPayloadDto, AmqpSignApproveDto } from '../ampq.dto';
import { TelegramUserDto } from '../user/user-telegram.dto';
import { UserService } from '../user/user.service';
import {
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeyEventResponseDto,
  KeyGetRequestDto,
  KeyListResponseDto,
  KeyParticipationDto,
  KeyShareDto,
  KeySignEventRequestDto,
  KeySignRequestDto,
  SignDto,
} from './keys.dto';
import { KeyEvent } from './keys.types';

@Injectable()
export class KeysService {
  constructor(
    @InjectPinoLogger(KeysService.name) private readonly logger: PinoLogger,
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

    const keysCount = await this.keys.countBy({
      userId: user.id,
      status: TaskStatus.Finished,
    });
    if (keysCount >= user.keyLimit) throw new ForbiddenException('Keys limit reached');

    dto.name = dto.name || `Key #${keysCount + 1}`;

    const uuid = randomUUID();
    this.eventEmitter.emit(KeyEvent.CREATE_REQUEST, uuid, dto, userId);

    await this.waitForApprove(KeyEvent.CREATE_RESPONSE, uuid, dto.timeoutSeconds * 1000);

    this.logger.debug(`Key generation approved: ${uuid}`);

    return this.saveKey(dto, userId);
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

      this.logger.debug(`Key saved: ${key.roomId}`);

      return new KeyDto({
        ...key,
        participants: participants.map((participant) => participant.index),
      });
    } catch (error) {
      queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
      this.logger.error('Create key transaction', error);
      throw new InternalServerErrorException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async getKey(dto: KeyGetRequestDto, userId?: number): Promise<KeyDto> {
    const participants = await this.participants.findBy({ keyId: dto.id });
    const participation = participants.findIndex((participant) => participant.userId === userId);
    if (userId && participation < 0) throw new NotFoundException('Key not found');

    const key = await this.keys.findOneBy({ ...dto, status: Not(In([TaskStatus.Timeout, TaskStatus.Error])) });
    if (!key) throw new NotFoundException('Key not found');

    return new KeyDto({
      ...key,
      participants: participants.map((participant) => participant.index),
    });
  }

  async getKeys(userId?: number): Promise<KeyListResponseDto> {
    const participations = await this.participants.findBy({ userId });
    const keyIds = participations.reduce<number[]>((acc, { keyId }) => {
      if (acc.findIndex((i) => i === keyId) < 0) acc.push(keyId);
      return acc;
    }, []);
    const keys = await this.keys.find({
      where: { id: In(keyIds), status: Not(In([TaskStatus.Timeout, TaskStatus.Error])) },
      relations: { participants: true },
    });

    return {
      items: keys.length
        ? keys.map(
            ({ participants, ...key }) =>
              new KeyDto({
                ...key,
                participants: participants.map((participant) => participant.index),
              }),
          )
        : [],
    };
  }

  async getKeyParticipationsByUser(userId: number): Promise<KeyParticipationDto[]> {
    const participations = await this.participants.find({
      where: { userId, key: { status: Not(In([TaskStatus.Timeout, TaskStatus.Error])) } },
      relations: { key: true },
    });

    return participations.map((participation) => ({
      keyId: participation.keyId,
      keyName: participation.key.name,
      userId: participation.userId,
      userIndex: participation.index,
      isOwner: userId === participation.key.userId,
    }));
  }

  async getTelegramUsersByKey(keyId: number): Promise<TelegramUserDto[]> {
    const participants = await this.participants.findBy({ keyId });
    return await Promise.all(participants.map(({ userId }) => this.users.getTelegramUser({ userId })));
  }

  async delete(dto: KeyDeleteRequestDto, userId?: number): Promise<KeyDeleteResponseDto> {
    const { affected } = await this.keys.delete({ id: dto.id, userId });
    return { affected };
  }

  async signKey(dto: KeySignRequestDto, userId?: number): Promise<SignDto> {
    const key = await this.keys.findOne({
      where: { publicKey: dto.publicKey, participants: { userId } },
      relations: { participants: true },
    });
    if (!key) throw new NotFoundException('Key not found');

    const signEventDto: KeySignEventRequestDto = {
      ...dto,
      keyId: key.id,
      timeoutSeconds: key.timeoutSeconds,
    };

    const uuid = randomUUID();
    this.eventEmitter.emit(KeyEvent.SIGN_REQUEST, uuid, signEventDto, userId);

    await this.waitForApprove(KeyEvent.SIGN_RESPONSE, uuid, key.timeoutSeconds * 1000);

    this.logger.debug(`Key sign approved: ${uuid}`);

    return this.saveSign({ ...dto, keyId: key.id, timeoutSeconds: key.timeoutSeconds }, userId);
  }

  async waitForApprove(keyEvent: KeyEvent, uuid: string, timeout?: number): Promise<boolean> {
    return this.eventEmitter
      .waitFor(keyEvent, {
        handleError: false,
        timeout,
        filter: (data: KeyEventResponseDto) => data.uuid === uuid,
        Promise,
        overload: false,
      })
      .then(([{ isApproved }]: [KeyEventResponseDto]) => {
        if (isApproved) return true;
        throw new Error('reject');
      })
      .catch((error) => {
        if (error.message === 'reject') throw new ForbiddenException('Rejected by user');
        if (error.message === 'timeout') throw new RequestTimeoutException('Timeout');
        this.logger.error(error);
        throw new InternalServerErrorException(error.message);
      });
  }

  async saveSign(dto: KeySignEventRequestDto, userId?: number): Promise<SignDto> {
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

        this.eventEmitter.emit(KeyEvent.CREATE_FINISHED, key.publicKey, key.userId);
      }

      await this.keys.createOrUpdateOne(key);

      this.logger.info('Keygen status update', key.status);
    } catch (error) {
      this.logger.error('Keygen status update fail', error);
    }
  }

  async handleSignStatusUpdate(payload: AmqpPayloadDto): Promise<void> {
    try {
      const sign = await this.signs.findOne({ where: { roomId: payload.room_id }, relations: { key: true } });

      sign.status = payload.status;

      if (sign.status === TaskStatus.Started) {
        sign.participantsConfirmations = payload.active_indexes;
      }

      if (sign.status === TaskStatus.Finished) {
        sign.participantsConfirmations = payload.active_indexes;
        sign.result = payload.result;

        this.eventEmitter.emit(KeyEvent.SIGN_FINISHED, sign.key.name, sign.key.userId);
      }

      await this.signs.createOrUpdateOne(sign);

      this.logger.info('Sign status update', sign.status);
    } catch (error) {
      this.logger.error('Sign status update fail', error);
    }
  }

  async shareKey(dto: KeyShareDto): Promise<void> {
    const participations = await this.participants.find({
      where: { key: { id: dto.keyId, status: Not(In([TaskStatus.Timeout, TaskStatus.Error])) } },
    });
    const key = await this.getKey({ id: dto.keyId });
    const owner = await this.users.getTelegramUser({ userId: key.userId });

    const ownerParticipation = participations.find((participation) => participation.userId === owner.userId);
    const userParticipation = participations.find((participation) => participation.userId === dto.userId);

    if (!userParticipation) {
      await this.participants.createOrUpdateOne({ ...dto, index: ownerParticipation.index });

      this.eventEmitter.emit(KeyEvent.SHARE_RESPONSE, key, owner.username, dto.userId);
    }
  }
}
