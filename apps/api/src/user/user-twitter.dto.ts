import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';




export class CreateTwitterUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;

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
  }
}
