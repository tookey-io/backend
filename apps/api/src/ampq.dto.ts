import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, ValidateIf } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@tookey/database';

export const AMQP_ACTION = ['keygen_status', 'sign_status', 'keygen_join', 'sign_approve'] as const;
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
