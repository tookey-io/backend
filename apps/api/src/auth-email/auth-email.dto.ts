import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsExist } from '../decorators/is-exist.validator';
import { lowerCaseTransformer } from '../decorators/lower-case.transformer';
import { IsNotExist } from '../decorators/is-not-exist.validator';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;
}

export class AuthConfirmEmailDto {
  @ApiProperty({
    example: '2ef8184e8a7680d003b8439d9e5a935a609384cc47829befbc070be84b54898f',
    minLength: 64,
    maxLength: 64,
    description: 'sha256 hash',
  })
  @IsNotEmpty()
  hash: string;
}

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
export class AuthForgotPasswordDto {
  @ApiProperty()
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;
}

export class AuthResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}

export class AuthUpdateDto {
  @ApiProperty({ example: 'John' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  oldPassword: string;
}
