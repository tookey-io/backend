import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PermissionKeyGuard extends AuthGuard('permission-key') {}
