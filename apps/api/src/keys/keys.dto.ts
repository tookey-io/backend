import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { formatISO } from 'date-fns';

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
  @IsNumber()
  userId: number;

  @ApiProperty()
  @Expose()
  @IsUUID()
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
  @IsString({ each: true })
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

  @ApiProperty()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ default: 3 })
  @IsNumber()
  participantsCount: number;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => formatISO(new Date(value)))
  createdAt: Date;

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
  @IsUUID()
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
  @IsString()
  @Transform(({ value }) => formatISO(new Date(value)))
  timeoutAt: Date;

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => value || '')
  data: string;

  @ApiProperty()
  @Expose()
  @IsObject()
  metadata: Record<string, any>;

  constructor(partial: Partial<SignDto>) {
    Object.assign(this, partial);
  }
}

export class KeyCreateRequestDto {
  @ApiProperty({ default: 2 })
  @IsNumber()
  participantsThreshold: number;

  @ApiProperty({ default: 3 })
  @IsNumber()
  participantsCount: number;

  @ApiPropertyOptional({ default: 60 })
  @IsNumber()
  timeoutSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(40)
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(200)
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MaxLength(40, { each: true })
  @IsString({ each: true })
  tags?: string[];
}

export class KeyEventResponseDto {
  @IsUUID()
  uuid: string;

  @IsNumber()
  userId: number;

  @IsBoolean()
  isApproved: boolean;
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
  @IsString()
  @Length(66, 66)
  publicKey: string;

  @ApiProperty()
  @IsNumber({}, { each: true })
  participantsConfirmations: number[];

  @ApiProperty()
  @IsString()
  data: string;

  @ApiProperty()
  @IsObject()
  metadata: Record<string, any>;
}

export class KeySignEventRequestDto extends KeySignRequestDto {
  @ApiProperty()
  @IsNumber()
  keyId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  timeoutSeconds: number;
}

export class KeyParticipationDto {
  @ApiProperty()
  @IsNumber()
  keyId: number;

  @ApiProperty()
  @IsString()
  keyName: string;

  @ApiProperty()
  @IsString()
  publicKey: string;

  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNumber()
  userIndex: number;

  @ApiProperty()
  @IsBoolean()
  isOwner: boolean;
}

export class KeyShareDto {
  @IsNumber()
  keyId: number;

  @IsNumber()
  userId: number;
}

export class KeyListResponseDto {
  @ApiProperty({ type: () => [KeyDto] })
  @ValidateNested({ each: true })
  @Type(() => KeyDto)
  items: KeyDto[];
}
