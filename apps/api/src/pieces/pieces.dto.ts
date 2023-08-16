import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsAlphanumeric, IsArray, IsNumber, IsObject, IsOptional, IsSemVer, IsString } from 'class-validator';

@Expose()
export class PieceDto {
  @ApiPropertyOptional()
  @Expose()
  @IsAlphanumeric()
  @IsOptional()
  id?: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsString()
  logoUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ default: "0.0.1" })
  @IsSemVer()
  version: string;
  
  @ApiProperty({ default: "0.0.1" })
  @IsSemVer()
  minimumSupportedRelease: string;
  
  @ApiProperty({ default: "999.99.99" })
  @IsSemVer()
  maximumSupportedRelease: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  auth?: Object;

  @ApiProperty()
  @IsObject()
  actions: Object;

  @ApiProperty()
  @IsObject()
  triggers: Object;
}
