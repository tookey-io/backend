import { AuthGuard } from '@nestjs/passport';

export class PermissionKeyJwtAuthGuard extends AuthGuard(['permission-key', 'jwt']) {}
