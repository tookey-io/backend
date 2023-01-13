import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, Matches } from 'class-validator';

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


export class AofgProfileDto {
  @Expose()
  @ApiPropertyOptional()
  @Matches(/[A-Za-z0-9\ ]{3,20}/)
  name?: string;

  @Expose()
  @ApiPropertyOptional()
  @Matches(/[a-f0-9]{40}/)
  multisigAddress?: string;

  @Expose()
  @ApiPropertyOptional()
  title?: string;
}