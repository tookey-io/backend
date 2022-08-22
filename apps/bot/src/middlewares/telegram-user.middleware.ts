import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserRepository } from "@tookey/database/entities/user.entity";
import { Context } from "telegraf";
import { TelegrafMiddleware } from "../bot.types";


const getUserId = (context: Context): number => {
  if ('callback_query' in context.update) {
    return context.update.callback_query.from.id;
  }

  if ('message' in context.update) {
    return context.update.message.from.id;
  }

  if ('my_chat_member' in context.update) {
    return context.update.my_chat_member.from.id;
  }

  throw new Error("Can not find user id");
};

@Injectable()
export class TelegramUserMiddleware implements TelegrafMiddleware {
  constructor(
    private readonly users: UserRepository
  ) { }

  async use(ctx: Context, next: () => Promise<void>) {
    const telegramUserId = getUserId(ctx);

    ctx.user = await this.users.findOne({
      where: {
        telegramUserId
      }
    })

    if (ctx.user) {
      const last = ctx.user.lastInteraction.getTime()
      const now = new Date().getTime()
      const diffTime = Math.abs(now - last);
      const diffSeconds = Math.floor(diffTime / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      ctx.user.lastInteraction = new Date()

      if (diffSeconds > 10)
        ctx.user.fresh = true
        
      await this.users.save(ctx.user)
    }

    await next();
  }
}
