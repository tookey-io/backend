import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';

export function JwtRefreshAuth() {
  return applyDecorators(
    UseGuards(JwtRefreshGuard),
    ApiBearerAuth('refresh'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
