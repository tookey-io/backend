import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetOrCreateAofgProfileDto {
  @ApiProperty()
  @IsNumber()
  userId: number;
}

export class UpdateAofgProfileNameDto {
  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @Matches(/[A-Za-z0-9\ ]{3,20}/)
  name: string;
}

export class UpdateAofgProfileMultisigDto {
  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @Matches(/[a-f0-9]{40}/)
  multisigAddress: string;
}

export class AofgProfileWalletDto {
  @IsString()
  @Matches(/[a-f0-9]{40}/)
  address: string;

  @IsNumber()
  balance: number;

  @IsNumber()
  staked: number;

  @IsNumber()
  totalStaked: number;
}

export class AofgProfileDto {
  @Expose()
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/[A-Za-z0-9\ ]{3,20}/)
  name?: string;

  @Expose()
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/[a-f0-9]{40}/)
  multisigAddress?: string;

  @Expose()
  @ApiPropertyOptional()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => AofgProfileWalletDto)
  wallet?: AofgProfileWalletDto;
}
