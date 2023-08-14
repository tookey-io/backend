import { SetMetadata } from '@nestjs/common';
import { rolePathToArray } from '../auth/role.utils';

export const AnyRoles = (...roles: string[]) => SetMetadata('any.roles', roles.map(rolePathToArray).flat());
