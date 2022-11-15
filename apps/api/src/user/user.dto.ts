import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { formatDistanceToNow } from 'date-fns';

import { ApiProperty } from '@nestjs/swagger';

import { KeyDto } from '../keys/keys.dto';

export class UserContextDto {
  @ApiProperty()
  @IsNumber()
  id: number;
}

export class UserRequestDto {
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
  @Transform(({ value }) => formatDistanceToNow(new Date(value)))
  lastInteraction: string;

  @ApiProperty()
  @Expose()
  @IsNumber()
  keyLimit: number;

  constructor(partial: Partial<KeyDto>) {
    Object.assign(this, partial);
  }
}
