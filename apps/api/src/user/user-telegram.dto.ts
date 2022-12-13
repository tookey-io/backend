import { Exclude, Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

import { UserDto } from './user.dto';

@Exclude()
export class TelegramUserDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto;

  @ApiProperty()
  @Expose()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  telegramId: number;

  @ApiProperty()
  @Expose()
  @IsNumber()
  chatId: number;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  languageCode?: string;

  constructor(partial: Partial<TelegramUserDto>) {
    Object.assign(this, partial);
  }
}

export class TelegramUserRequestDto {
  @ApiPropertyOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional()
  @IsNumber()
  telegramId?: number;

  @ApiPropertyOptional()
  @IsString()
  username?: string;
}

export class CreateTelegramUserDto {
  @IsNumber()
  telegramId: number;

  @IsNumber()
  chatId: number;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsString()
  invitedBy?: string;
}

export class UpdateTelegramUserDto extends OmitType(PartialType(TelegramUserDto), ['id', 'user'] as const) {}
