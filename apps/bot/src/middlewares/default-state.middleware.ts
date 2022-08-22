import { Injectable } from "@nestjs/common";
import { MiddlewareFn, Context } from "telegraf";
import { Update } from "telegraf/types";
import { TelegrafMiddleware, TookeyContext } from "../bot.types";

@Injectable()
export class DefaultStateMiddleware implements TelegrafMiddleware {
    async use(ctx: TookeyContext, next: () => Promise<void>) {
        console.log(ctx)
        // ctx.session.state.messages ??= []

        await next()
    }
}