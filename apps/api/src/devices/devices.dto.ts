import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserDeviceType } from "@tookey/database";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class DevicesDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description?: string;

  constructor(partial: Partial<DevicesDto>) {
    Object.assign(this, partial);
  }
}

export class DeviceUpdateRequestDto {
  @ApiProperty()
  @IsString()
  token: string;
  
  @ApiProperty()
  @IsString({ each: true })
  publicKeys: string[];

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @ApiProperty()
  @IsEnum(UserDeviceType)
  @IsOptional()
  deviceType?: UserDeviceType;
}