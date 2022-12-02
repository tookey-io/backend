import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { formatISO } from 'date-fns';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { KeyDto } from '../keys/keys.dto';

export class PermissionDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  description: string;

  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }
}

export class PermissionResponseDto {
  @ApiProperty()
  @IsString()
  permissions: PermissionDto;

  @ApiProperty()
  @IsString()
  keys: KeyDto;
}

export class PermissionTokenCreateRequestDto {
  @ApiProperty()
  @IsString({ each: true })
  @Length(66, 66, { each: true })
  keys: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permissions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ttl?: number;
}

@Exclude()
export class PermissionTokenDto {
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
  token: string;

  @ApiProperty()
  @Expose()
  @IsString({ each: true })
  @Length(66, 66, { each: true })
  keys: string[];

  @ApiProperty({ type: () => [PermissionDto] })
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];

  @ApiPropertyOptional()
  @Expose()
  @IsString()
  @Transform(({ value }) => formatISO(new Date(value)))
  validUntil?: Date;

  constructor(partial: Partial<PermissionTokenDto>) {
    Object.assign(this, partial);
  }
}
