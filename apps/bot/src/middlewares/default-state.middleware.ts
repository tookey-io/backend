import { Injectable } from '@nestjs/common';

import { TelegrafMiddleware, TookeyContext } from '../bot.types';

@Injectable()
export class DefaultStateMiddleware implements TelegrafMiddleware {
  async use(ctx: TookeyContext, next: () => Promise<void>) {
    // ctx.session.state.messages ??= []

    await next();
  }
}
