import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export enum Edition {
  COMMUNITY = 'ce',
  ENTERPRISE = 'ee',
  CLOUD = 'cloud',
}

export enum AuthorizationMethod {
  HEADER = 'HEADER',
  BODY = 'BODY',
}

export class RefreshConnectionDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;

  @ApiProperty()
  @IsString()
  pieceName: string;

  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  edition?: Edition;

  @ApiPropertyOptional()
  @IsOptional()
  authorizationMethod?: AuthorizationMethod;

  @ApiProperty()
  @IsUrl()
  tokenUrl: string;
}

export class ClaimConnectionDto {
  @ApiProperty()
  @IsString()
  pieceName: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsUrl()
  tokenUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codeVerifier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  edition?: Edition;

  @ApiPropertyOptional()
  @IsOptional()
  authorizationMethod?: AuthorizationMethod;
}

export class CreateOrUpdateSecretDto {
  @ApiProperty()
  @IsString()
  pieceName: string;

  @ApiProperty()
  @IsString()
  clientSecret: string;

  @ApiProperty()
  @IsString()
  clientId: string;
}
