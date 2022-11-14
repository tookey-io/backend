import * as tg from 'telegraf/types';

import { TookeyContext } from '../bot.types';

export abstract class BaseScene {
  protected getCallbackData(
    ctx: TookeyContext<tg.Update.CallbackQueryUpdate>,
  ): string {
    return ctx.callbackQuery.data;
  }

  protected getCallbackPayload(
    ctx: TookeyContext<tg.Update.CallbackQueryUpdate>,
    prefix: string,
  ) {
    const callbackData = this.getCallbackData(ctx);
    return callbackData.replace(prefix, '');
  }
}
