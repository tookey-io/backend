import { TookeyContext } from '../bot.types';

export abstract class BaseScene {
  protected getCallbackData(ctx: TookeyContext): string {
    if ("data" in ctx.callbackQuery) {
      return ctx.callbackQuery.data;
    } else {
      // TODO: figure out issue with GameQuery callback
      return ""
    }
  }

  protected getCallbackPayload(ctx: TookeyContext, prefix: string) {
    const callbackData = this.getCallbackData(ctx);
    return callbackData.replace(prefix, '');
  }
}
