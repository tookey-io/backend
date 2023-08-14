import { Transform, Type } from 'class-transformer';
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

export class PricipalDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  roles: string[];

  @ApiProperty()
  @IsString({ each: true })
  keys?: string[];
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
}

export class AuthTwitterCallbackDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  state: string;
}
