import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { PermissionKeyJwtAuthGuard } from '../guards/permission-key-jwt-auth.guard';

export function PermissionKeyJwtAuth() {
  return applyDecorators(
    UseGuards(PermissionKeyJwtAuthGuard),
    ApiSecurity('permissionKey'),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
