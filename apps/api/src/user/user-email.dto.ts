import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEmail, IsNumberString, IsOptional } from "class-validator";

export class CreateEmailUserDto {
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
    email: string;
  }
  