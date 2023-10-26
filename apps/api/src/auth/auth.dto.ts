import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@tookey/database';

export class AuthTokenDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  validUntil: string;
}

export class PricipalDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  roles: string[];

  @ApiProperty()
  @IsString({ each: true })
  keys?: string[];
}

export class AccessTokenResponseDto {
  
}

export class AuthTokensResponseDto {
  @ApiProperty({ type: () => AuthTokenDto })
  @ValidateNested()
  @Type(() => AuthTokenDto)
  access: AuthTokenDto;

  @ApiProperty({ type: () => AuthTokenDto })
  @ValidateNested()
  @Type(() => AuthTokenDto)
  refresh: AuthTokenDto;

  @ApiProperty({ type: () => User })
  @ValidateNested()
  @Type(() => User)
  user: User;
}

export class AuthTwitterCallbackDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  state: string;
}

export class AuthGoogleLoginDto {
  @ApiProperty({ example: 'abc', description: 'Google id token (receive from Google OAuth)' })
  @IsNotEmpty()
  idToken: string;
}
