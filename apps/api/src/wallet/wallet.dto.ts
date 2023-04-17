import { IsEthereumAddress, IsNumber, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletCreateRequestDto {
  @ApiProperty()
  @IsString()
  password: string;
}

export class WalletTssCreateRequestDto {
  @ApiProperty()
  @IsString()
  roomId: string;
}

export class WalletTssSignRequestDto {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @IsString()
  data: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  publicKey?: string;
}

export class WalletResponseDto {
  @ApiProperty()
  @IsString()
  address: string;
}

export class WalletSignCallPermitDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deadline?: number;
}

export class WalletCallPermitMessageDto {
  @ApiProperty()
  @IsEthereumAddress()
  from: string;

  @ApiProperty()
  @IsEthereumAddress()
  to: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiProperty()
  @IsString()
  data: string;

  @ApiProperty()
  @IsString()
  gaslimit: string;

  @ApiProperty()
  @IsString()
  nonce: string;

  @ApiProperty()
  @IsString()
  deadline: string;
}
