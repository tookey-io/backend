import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { formatISO } from 'date-fns';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

import { KeyDto } from '../keys/keys.dto';

export class UserContextDto {
  @ApiProperty()
  @IsNumber()
  id: number;
}

@Exclude()
export class UserDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsBoolean()
  fresh: boolean;

  @ApiProperty()
  @Expose()
  @IsString()
  @Transform(({ value }) => formatISO(new Date(value)))
  lastInteraction: Date;

  @ApiProperty()
  @Expose()
  @IsNumber()
  keyLimit: number;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}

export class UserRequestDto {
  @ApiPropertyOptional()
  @IsNumber()
  id?: number;
}

export class CreateUserDto {}

export class UpdateUserDto extends OmitType(PartialType(UserDto), ['id', 'lastInteraction'] as const) {
  @ApiProperty()
  @Expose()
  @IsDate()
  lastInteraction?: Date;
}
