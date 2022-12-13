import { Exclude, Expose, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

import { UserDto } from '../user/user.dto';

export class TwitterAuthUrlResponseDto {
  @ApiProperty()
  @IsString()
  url: string;
}

export class TwitterAccessTokenRequestDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  codeVerifier: string;
}

@Exclude()
export class TwitterUserDto {
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
  twitterId: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  username?: string;

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

  constructor(partial: Partial<TwitterUserDto>) {
    Object.assign(this, partial);
  }
}

export class TwitterUserRequestDto {
  @ApiPropertyOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional()
  @IsString()
  twitterId?: string;

  @ApiPropertyOptional()
  @IsString()
  username?: string;
}

export class CreateTwitterUserDto {
  @IsString()
  twitterId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  invitedBy?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDate()
  validUntil?: Date;
}

export class UpdateTwitterUserDto extends OmitType(PartialType(TwitterUserDto), ['id', 'user'] as const) {}

export class CreateTweetDto {
  @ApiProperty()
  @IsString()
  tweet: string;
}
