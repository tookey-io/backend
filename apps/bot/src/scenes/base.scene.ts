import { TookeyContext } from '../bot.types';

export abstract class BaseScene {
  protected getCallbackData(ctx: TookeyContext): string {
    return ctx.callbackQuery.data;
  }

  protected getCallbackPayload(ctx: TookeyContext, prefix: string) {
    const callbackData = this.getCallbackData(ctx);
    return callbackData.replace(prefix, '');
  }
}
