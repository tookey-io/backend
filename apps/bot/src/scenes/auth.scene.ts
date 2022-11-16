import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Ctx, InjectBot, Scene, SceneEnter } from 'nestjs-telegraf';
import * as QR from 'qrcode';
import { Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { AccessService } from '@tookey/access';

import { BotScene } from '../bot.constants';
import { TookeyContext } from '../bot.types';

@Scene(BotScene.AUTH)
export class AuthScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(AuthScene.name) private readonly logger: PinoLogger,
    private readonly accessService: AccessService,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext<tg.Update.MessageUpdate>) {
    this.logger.debug(ctx.scene.state);

    const userTelegram = ctx.user;
    const { user } = userTelegram;
    const { token } = await this.accessService.getAccessToken(user.id);
    const encoded = `tookey://access/${token}`;
    const qr = await QR.toBuffer(encoded);

    this.logger.debug(token, 'token');

    await ctx.deleteMessage(ctx.message.message_id);

    if (!ctx.scene.state.authCode) {
      ctx.scene.state.authCode = await ctx.replyWithPhoto({ source: qr });
      this.updateAuthCode(ctx, 60);
    }

    ctx.scene.leave();
  }

  private async updateAuthCode(@Ctx() ctx: TookeyContext<tg.Update.MessageUpdate>, timeLeft: number): Promise<void> {
    if (ctx.scene.state.authCode && timeLeft === 0) {
      await ctx.deleteMessage(ctx.scene.state.authCode.message_id);
      delete ctx.scene.state.authCode;
      return;
    }

    if (ctx.scene.state.authCode) {
      await this.bot.telegram.editMessageCaption(
        ctx.update.message.chat.id,
        ctx.scene.state.authCode.message_id,
        undefined,
        ['Scan QR code in <b>Tookey Signer</b> to authenticate', `Removes in ${timeLeft} sec`].join('\n'),
        { parse_mode: 'HTML' },
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.updateAuthCode(ctx, timeLeft - 1);
    }
  }
}