import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

import { UserDto } from '../user/user.dto';

@Exclude()
export class DiscordUserDto {
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
  // @Expose()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @Expose()
  @IsString()
  discordId: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  discordTag?: string;

  @ApiPropertyOptional()
  // @Expose()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  validUntil?: Date;

  constructor(partial: Partial<DiscordUserDto>) {
    Object.assign(this, partial);
  }
}

export class DiscordUserRequestDto {
  @ApiPropertyOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional()
  @IsString()
  discordId?: string;

  @ApiPropertyOptional()
  @IsString()
  discordTag?: string;

  @ApiPropertyOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  verified?: boolean;
}

export class CreateDiscordUserDto {
  @IsString()
  discordId: string;

  @IsOptional()
  @IsString()
  discordTag?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  invitedBy?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  validUntil?: Date;
}

export class UpdateDiscordUserDto extends OmitType(PartialType(DiscordUserDto), ['id', 'user'] as const) {}

export class DiscordTokenExchangeDto {
  @IsString()
  accessToken: string;
  @IsNumber()
  expiresIn: number;
  @IsString()
  refreshToken: string;
  @IsString()
  scope: string;
  @IsString()
  tokenType: string;
}

export class DiscordAuthUrlResponseDto {
  @ApiProperty()
  @IsString()
  url: string;
}

export class DiscordAccessTokenRequestDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class DiscordGuildMembershipRequestDto {
  @ApiProperty({ example: '1052191123092811816' })
  @IsString()
  guild: string;
}

export class DiscordGuildMembershipResponseDto {
  @ApiProperty()
  @IsBoolean()
  isMember: boolean;

  @ApiProperty()
  username: string;

  @ApiProperty()
  roles: string[]
}
