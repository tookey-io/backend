import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  validUntil: string;
}

export class AuthSigninResponseDto {
  @ApiProperty({ type: () => AuthTokenDto })
  @ValidateNested()
  @Type(() => AuthTokenDto)
  access: AuthTokenDto;

  @ApiProperty({ type: () => AuthTokenDto })
  @ValidateNested()
  @Type(() => AuthTokenDto)
  refresh: AuthTokenDto;
}
