import { SetMetadata } from '@nestjs/common';
import { rolePathToArray } from '../auth/role.utils';

export const AllRoles = (...roles: string[]) => SetMetadata('all.roles', roles.map(rolePathToArray).flat());
