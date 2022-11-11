import { randomUUID } from 'crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AmqpService } from '@tookey/amqp';
import {
  KeyParticipantRepository,
  KeyRepository,
  SignRepository,
  TaskStatus,
  UserRepository,
} from '@tookey/database';

import {
  AmqpKeygenJoinDto,
  AmqpPayloadDto,
  AmqpSignApproveDto,
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeyGetRequestDto,
  KeySignRequestDto,
  SignDto,
} from './keys.dto';

@Injectable()
export class KeyService {
  private readonly logger = new Logger(KeyService.name);

  constructor(
    private readonly amqp: AmqpService,
    private readonly keys: KeyRepository,
    private readonly participants: KeyParticipantRepository,
    private readonly signs: SignRepository,
    private readonly users: UserRepository,
  ) {}

  async create(dto: KeyCreateRequestDto): Promise<KeyDto> {
    const user = await this.users.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('User not found');

    const { id, participantIndex } = await this.keys.createOrUpdateOne({
      user,
      roomId: randomUUID(),
      participantsThreshold: dto.participantsThreshold,
      timeoutSeconds: dto.timeoutSeconds,
      name: dto.name,
      description: dto.description,
      tags: dto.tags,
    });

    await this.participants.createOrUpdateOne({
      keyId: id,
      userId: user.id,
      index: participantIndex,
    });

    const { participants, ...key } = await this.keys.findOneBy({ id });

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

    return new KeyDto({
      ...key,
      participants: participants.map((participant) => participant.index),
    });
  }

  async get(dto: KeyGetRequestDto): Promise<KeyDto> {
    const data = await this.keys.findOneBy(dto);
    if (!data) throw new NotFoundException('Key not found');

    const { participants, ...key } = data;

    return new KeyDto({
      ...key,
      participants: participants.map((participant) => participant.index),
    });
  }

  async delete(dto: KeyDeleteRequestDto): Promise<KeyDeleteResponseDto> {
    const { affected } = await this.keys.delete({ id: dto.id });
    return { affected };
  }

  async sign(dto: KeySignRequestDto): Promise<SignDto> {
    const key = await this.keys.findOneBy({ id: dto.keyId });
    if (!key) throw new NotFoundException('Key not found');

    const { id } = await this.signs.createOrUpdateOne({
      key,
      roomId: dto.roomId,
      data: dto.data,
      metadata: dto.metadata,
      participantsConfirmations: [],
      timeoutAt: new Date(),
    });

    const sign = await this.signs.findOneBy({ id });

    this.amqp.publish<AmqpSignApproveDto>('amq.topic', 'manager', {
      action: 'sign_approve',
      user_id: `${sign.key.user}`,
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
