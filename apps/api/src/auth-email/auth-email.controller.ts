import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthConfirmEmailDto,
  AuthEmailLoginDto,
  AuthForgotPasswordDto,
  AuthRegisterLoginDto,
  AuthResetPasswordDto,
} from './auth-email.dto';
import { AuthEmailService } from './auth-email.service';

@Controller('api/auth/email')
@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthEmailController {
  constructor(private readonly service: AuthEmailService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Email already exists' })
  async register(@Body() createUserDto: AuthRegisterLoginDto) {
    return this.service.register(createUserDto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'User already verified' })
  @ApiNotFoundResponse({ description: "User doesn't exist (or verification code isn't valid)" })
  async confirmEmail(@Body() confirmEmailDto: AuthConfirmEmailDto) {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthEmailLoginDto) {
    return this.service.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() forgotPasswordDto: AuthForgotPasswordDto) {
    return this.service.forgotPassword(forgotPasswordDto.email);
  }

  //   @Post('reset-password')
  //   @HttpCode(HttpStatus.NO_CONTENT)
  //   resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
  //     return this.service.resetPassword(
  //       resetPasswordDto.hash,
  //       resetPasswordDto.password,
  //     );
  //   }
}
