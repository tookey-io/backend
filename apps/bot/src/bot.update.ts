import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Command, Ctx, InjectBot, Sender, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { UseFilters } from '@nestjs/common';

import { BotCommand, BotScene } from './bot.constants';
import { TookeyContext } from './bot.types';
import { ValidationException } from './exceptions/validation.exception';
import { BaseScene } from './scenes/base.scene';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate extends BaseScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(BotUpdate.name) private readonly logger: PinoLogger,
  ) {
    super();
    this.handleError();
  }

  @Start()
  async onStart(@Ctx() ctx: TookeyContext, @Sender() sender: tg.User) {
    if (ctx.chat.id != sender.id) {
      throw new ValidationException(`Hi, ${sender.first_name}! Go to @tookey_bot to manage your keys`);
    }
    if (ctx.session.__scenes.current) await ctx.scene.leave();

    // https://t.me/tookey_bot?start=YXBwPWF1dGg
    if (ctx.startPayload) {
      const encoded = Buffer.from(ctx.startPayload, 'base64').toString('ascii').split('=');
      if (encoded[0] === 'app' && encoded[1] === 'auth') ctx.scene.state.appAuth = true;
    }

    await ctx.scene.enter(BotScene.INIT, ctx.scene.state);
  }

  @Command(BotCommand.AUTH)
  async authCode(@Ctx() ctx: TookeyContext) {
    await ctx.scene.enter(BotScene.AUTH);
  }

  private handleError(): void {
    this.bot.catch((err: any) => this.logger.error(err));
  }
}
