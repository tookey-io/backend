import { IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class WalletCreateRequestDto {
  @ApiProperty()
  @IsString()
  password: string;
}

export class WalletResponseDto {
  @ApiProperty()
  @IsString()
  address: string;
}
