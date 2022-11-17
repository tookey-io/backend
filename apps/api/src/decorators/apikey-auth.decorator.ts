import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ApiKeyGuard } from '../guards/apikey.guard';

export function ApiKeyAuth() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiSecurity('apiKey'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
