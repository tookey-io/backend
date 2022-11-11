import { Injectable, Logger } from '@nestjs/common';

import { TelegrafMiddleware, TookeyContext } from '../bot.types';

@Injectable()
export class DefaultStateMiddleware implements TelegrafMiddleware {
  private readonly logger = new Logger(DefaultStateMiddleware.name);

  async use(ctx: TookeyContext, next: () => Promise<void>) {
    // this.logger.debug(ctx.update);
    // ctx.session.state.messages ??= []

    await next();
  }
}
