import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserContextDto } from '../user/user.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(RolesGuard.name) private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAnyRoles =
      this.reflector.getAllAndOverride<string[]>('any.roles', [context.getHandler(), context.getClass()]) || [];
    const requiredAllRoles =
      this.reflector.getAllAndOverride<string[]>('all.roles', [context.getHandler(), context.getClass()]) || [];

    const { user } = context.switchToHttp().getRequest() as { user: UserContextDto };

    const passAny = requiredAnyRoles.length === 0 || this.hasAnyRole(user, requiredAnyRoles);
    const passAll = requiredAllRoles.length === 0 || this.hasAllRoles(user, requiredAllRoles);
    this.logger.info(`roles: ${user?.roles}, requiredAnyRoles: ${requiredAnyRoles}, requiredAllRoles: ${requiredAllRoles}`);

    return passAny && passAll;
  }

  hasAllRoles(user: UserContextDto, requiredAllRoles: string[]): boolean {
    return requiredAllRoles.every((role) => user?.roles?.includes(role));
  }

  hasAnyRole(user: UserContextDto, requiredAnyRoles: string[]): boolean {
    return requiredAnyRoles.some((role) => user?.roles?.includes(role));
  }
}
