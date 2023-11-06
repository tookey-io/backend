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
      // return true
      const observableOrPromise = super.canActivate(context);
      if (isPromise(observableOrPromise)) {
        return observableOrPromise.catch(() => true).then(() => true);
      }
      if (isObservable(observableOrPromise)) {
        return observableOrPromise.pipe(map(() => true));
      }

      console.log('isOther')
      return true;
    } else {
      return super.canActivate(context);
    }
  }
}
