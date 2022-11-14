import { Exclude, Expose, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@tookey/database';

@Exclude()
export class KeyDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  roomId: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  participantsThreshold: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  timeoutSeconds: number;

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => value || '')
  name: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => value || '')
  description: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => value || [])
  tags: string[];

  @ApiProperty()
  @Expose()
  @IsNumber({}, { each: true })
  participants: number[];

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => value || '')
  publicKey: string;

  constructor(partial: Partial<KeyDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class SignDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  roomId: string;

  @ApiProperty()
  @Expose()
  @IsNumber({}, { each: true })
  participants: number[];

  @ApiProperty()
  @Expose()
  @IsNumber({}, { each: true })
  participantsConfirmations: number[];

  @ApiProperty()
  @Expose()
  @IsString()
  timeoutAt: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => value || '')
  data: string;

  @ApiProperty()
  @Expose()
  @IsObject()
  metadata: any;

  constructor(partial: Partial<KeyDto>) {
    Object.assign(this, partial);
  }
}

export class KeyCreateRequestDto {
  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNumber()
  participantsThreshold: number;

  @ApiProperty()
  @IsNumber()
  participantsCount: number;

  @ApiPropertyOptional()
  @IsNumber()
  timeoutSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class KeyGetRequestDto {
  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  id: number;
}

export class KeyDeleteRequestDto {
  @ApiProperty()
  @IsNumber()
  id: number;
}
export class KeyDeleteResponseDto {
  @ApiProperty()
  @IsNumber()
  affected: number;
}

export class KeySignRequestDto {
  @ApiProperty()
  @IsNumber()
  keyId: number;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @IsNumber({}, { each: true })
  participantsConfirmations: number[];

  @ApiProperty()
  @IsString()
  data: string;

  @ApiProperty()
  @IsObject()
  metadata: any;
}

export const AMQP_ACTION = [
  'keygen_status',
  'sign_status',
  'keygen_join',
  'sign_approve',
] as const;
export type ActionStatus = typeof AMQP_ACTION[number];

export class AmqpPayloadDto {
  @ApiProperty({ enum: AMQP_ACTION })
  @IsEnum(AMQP_ACTION)
  action: Extract<ActionStatus, 'keygen_status' | 'sign_status'>;

  @ApiProperty()
  @IsString()
  room_id: string;

  @ApiProperty()
  @Transform(({ value }) => value || [])
  @IsNumber({}, { each: true })
  active_indexes: number[];

  @ApiProperty()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional()
  @ValidateIf(({ action }: AmqpPayloadDto) => action === 'keygen_status')
  @Transform(({ value }) => value || '')
  @IsString()
  public_key?: string;

  @ApiPropertyOptional()
  @ValidateIf(({ action }: AmqpPayloadDto) => action === 'sign_status')
  @Transform(({ value }) => value || '')
  @IsString()
  result?: string;
}

class AmpqMessageDto {
  @ApiProperty({ enum: AMQP_ACTION })
  @IsEnum(AMQP_ACTION)
  action: Extract<ActionStatus, 'keygen_join' | 'sign_approve'>;

  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty()
  @IsString()
  room_id: string;

  @ApiProperty()
  @IsString()
  key_id: string;

  // @IsString()
  // relay_address: string;
}

export class AmqpKeygenJoinDto extends AmpqMessageDto {
  @ApiProperty()
  @IsNumber()
  participant_index: number;

  @ApiProperty()
  @IsNumber()
  participants_count: number;

  @ApiProperty()
  @IsNumber()
  participants_threshold: number;

  @ApiProperty()
  @IsNumber()
  timeout_seconds: number;
}

export class AmqpSignApproveDto extends AmpqMessageDto {
  @ApiProperty()
  @IsNumber({}, { each: true })
  participants_indexes: number[];

  @ApiProperty()
  @IsString()
  data: string;

  @ApiProperty()
  @IsNumber()
  timeout_seconds: number;
}
