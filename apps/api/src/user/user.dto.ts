import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { formatISO } from 'date-fns';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

export class UserContextDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @IsString({ each: true })
  keys?: string[];

  @ApiPropertyOptional()
  @IsString({ each: true })
  permissions?: string[];
}

@Exclude()
export class UserDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @IsUUID()
  @Expose()
  @IsOptional()
  uuid?: string;

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

export class CreateUserDto {
  @IsOptional()
  @IsString()
  invitedBy?: string;
}

export class UpdateUserDto extends OmitType(PartialType(UserDto), ['id', 'lastInteraction'] as const) {
  @ApiProperty()
  @Expose()
  @IsDate()
  lastInteraction?: Date;
}
