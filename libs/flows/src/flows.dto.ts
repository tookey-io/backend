import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsAlphanumeric, IsBoolean, IsNumber, IsString } from "class-validator";

export class ExternalUserInjectDto {
  @ApiProperty()
  @IsString()
  @IsAlphanumeric()
  id: string;
  
  @ApiProperty()
  @IsString()
  firstName: string;
  
  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsBoolean()
  trackEvents?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  newsLetter?: boolean;
}

export class ExternalUserAuthDto {
  @ApiProperty()
  @IsString()
  @IsAlphanumeric()
  id: string;

  @ApiProperty()
  @IsString()
  token?: string;
}