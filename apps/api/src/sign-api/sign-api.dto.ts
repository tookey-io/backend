import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Matches, IsNumber, IsString, IsObject, ValidateNested, IsOptional } from 'class-validator';

export abstract class SignTaskMetaDto<T> {
  kind: T;
}

export class SignTaskEthereumTxMetaDto extends SignTaskMetaDto<'ethereum-tx'> {
  @ApiPropertyOptional()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  @IsOptional()
  to?: string;

  @ApiProperty()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  from: string;

  @ApiProperty()
  @Matches(/^0x[a-fA-F0-9]+$/)
  nonce: string;

  @ApiProperty()
  @Matches(/^0x[a-fA-F0-9]+$/)
  gasLimit: string;

  @ApiProperty()
  @Matches(/^0x[a-fA-F0-9]+$/)
  gasPrice: string;

  @ApiPropertyOptional()
  @Matches(/^0x[a-fA-F0-9]+$/)
  @IsOptional()
  data?: string;

  @ApiPropertyOptional()
  @Matches(/^0x[a-fA-F0-9]+$/)
  @IsOptional()
  value?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  chainId?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  type?: number;

  @ApiPropertyOptional()
  @Matches(/^0x[a-fA-F0-9]+$/)
  @IsOptional()
  maxPriorityFeePerGas?: string;

  @ApiPropertyOptional()
  @Matches(/^0x[a-fA-F0-9]+$/)
  @IsOptional()
  maxFeePerGas?: string;
  // accessList?: AccessListish;
  // customData?: Record<string, any>;
  // ccipReadEnabled?: boolean;
}

export class SignTaskEthereumMessageMetaDto extends SignTaskMetaDto<'ethereum-message'> {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  chainId?: number;
}

export class TypedDataDomainDto {
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsString()
  version: string;
  @ApiProperty()
  @IsNumber()
  chainId: number;
  @ApiProperty()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  verifyingContract: string;
}

export class TypedDataTypesDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: string;
}

export class SignTaskEthereumTypedDataMetaDto extends SignTaskMetaDto<'ethereum-typed-data'> {
  @ApiProperty({ type: () => TypedDataDomainDto })
  @Type(() => TypedDataDomainDto)
  domain: TypedDataDomainDto;

  @ApiProperty()
  @IsObject()
  types: Record<string, Array<TypedDataTypesDto>>;

  @ApiProperty()
  @IsObject()
  values: Record<string, any>;
}

export class SignTaskDto {
  @ApiProperty()
  @Matches(/^[a-fA-F0-9]{66}$/)
  publicKey: string;

  @ApiProperty()
  @Matches(/^0x[a-fA-F0-9]{64}$/)
  digest: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  // @ValidateNested()
  // @Type(() => SignTaskMetaDto<'ethereum-tx' | 'ethereum-message' | 'ethereum-typed-data'>, {
  //   discriminator: {
  //     property: 'kind',
  //     subTypes: [
  //       { value: SignTaskEthereumTxMetaDto, name: 'ethereum-tx' },
  //       { value: SignTaskEthereumMessageMetaDto, name: 'ethereum-message' },
  //       { value: SignTaskEthereumTypedDataMetaDto, name: 'ethereum-typed-data' },
  //     ]
  //   }
  // })
  // meta?: SignTaskMetaDto<'ethereum-tx' | 'ethereum-message' | 'ethereum-typed-data'>;
  meta?: Record<string, any>;
}

export class SignInitializeDto {
  @ApiProperty({ type: () => SignTaskDto })
  @Type(() => SignTaskDto)
  @ValidateNested()
  task: SignTaskDto;

  @ApiProperty()
  @IsString()
  externalSignerToken: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeout?: number;
}

export class SignJoinDto {
  @ApiProperty({ type: () => SignTaskDto })
  @Type(() => SignTaskDto)
  @ValidateNested()
  task: SignTaskDto;

  @ApiProperty()
  @IsNumber()
  timeout?: number;
}
