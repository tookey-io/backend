import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ShareableKeyJwtGuard } from '../guards/shareable-key-jwt.guard';

export function ShareableKeyJwtAuth() {
  return applyDecorators(
    UseGuards(ShareableKeyJwtGuard),
    ApiSecurity('shareable'),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
