import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { SigninKeyGuard } from '../guards/signin-key.guard';

export function SigninKeyAuth() {
  return applyDecorators(
    UseGuards(SigninKeyGuard),
    ApiSecurity('signin'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
