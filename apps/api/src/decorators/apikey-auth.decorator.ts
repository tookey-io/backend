import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthKeyGuard } from '../guards/auth-key.guard';

export function ApiKeyAuth() {
  return applyDecorators(
    UseGuards(AuthKeyGuard),
    ApiSecurity('apiKey'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
