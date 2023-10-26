import { Exclude, Expose, Type } from 'class-transformer';
import { IsEmail, isNotEmpty, IsNumber, IsNumberString, IsOptional, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

import { UserDto } from './user.dto';
import { addSeconds } from 'date-fns';

@Exclude()
export class GoogleUserDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsNumberString()
  googleId: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsNumber()
  userId?: number;

  constructor(partial: Partial<GoogleUserDto>) {
    Object.assign(this, partial);
  }
}

export class CreateGoogleUserDto {
  @ApiProperty()
  @Expose()
  @IsNumberString()
  googleId: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateDiscordUserDto {
  @ApiProperty()
  @Expose()
  @IsNumberString()
  id: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  discriminator?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  global_name?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @Expose()
  verified: boolean;

  @ApiProperty()
  @Exclude()
  accessToken: string;

  @ApiProperty()
  @Exclude()
  validUntil: Date;

  @ApiProperty()
  @Exclude()
  refreshToken: string;

  constructor(partial: any) {
    Object.assign(this, partial);

    if (!this.validUntil && typeof partial.expiresIn === 'number') {
      this.validUntil = addSeconds(new Date(), partial.expiresIn / 1000);
    }
  }
}
