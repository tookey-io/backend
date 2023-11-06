import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, map, Observable } from 'rxjs';
import { isPromise } from 'util/types';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('PUBLIC_ROUTE', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const observableOrPromise = super.canActivate(context);
      if (isPromise(observableOrPromise)) {
        return observableOrPromise.then((r) => r || true);
      }
      if (isObservable(observableOrPromise)) {
        return observableOrPromise.pipe(map(() => true));
      }

      return observableOrPromise || true;
    } else {
      return super.canActivate(context);
    }
  }
}
