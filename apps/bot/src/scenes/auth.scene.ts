import { AuthEvent } from 'apps/api/src/api.events';
import { UserService } from 'apps/api/src/user/user.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Ctx, InjectBot, Scene, SceneEnter } from 'nestjs-telegraf';
import * as QR from 'qrcode';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { UseFilters } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccessService } from '@tookey/access';

import { BotAction, BotScene } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { FlowsService } from '@tookey/flows';

@Scene(BotScene.AUTH)
@UseFilters(TelegrafExceptionFilter)
export class AuthScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(AuthScene.name) private readonly logger: PinoLogger,
    private readonly accessService: AccessService,
    private readonly userService: UserService,
    private readonly flowsService: FlowsService,
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

    // await ctx.deleteMessage(ctx.message.message_id);
    ctx.scene.state.auth = {
      showText: false,
      token: token,
      code: await ctx.replyWithPhoto({ source: qr }),
      timeLeft: 60,
    };

    await this.updateAuthCode(ctx);

    setTimeout(() => {
      this.deleteAuthCode(ctx);
    }, 60000);
  }

  @OnEvent(AuthEvent.SIGNIN)
  async onKeyCreateFinished(userId: number, environment?: string) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    await this.bot.telegram.sendMessage(
      telegramUser.chatId,
      `✅ Successfully authenticated in <b>${environment || 'Mobile Signer'}</b>!`,
      {
        parse_mode: 'HTML',
      },
    );
  }

  private async deleteAuthCode(@Ctx() ctx: TookeyContext): Promise<void> {
    const state = ctx.scene.state.auth;
    if (typeof state === 'undefined') {
      return;
    }

    await ctx.deleteMessage(state.code.message_id);
    delete ctx.scene.state.auth;
  }

  private async updateAuthCode(@Ctx() ctx: TookeyContext): Promise<void> {
    const state = ctx.scene.state.auth;
    if (typeof state === 'undefined') {
      return;
    }

    const show = Boolean(state.showText);

    try {
      await this.bot.telegram.editMessageCaption(
        state.code.chat.id,
        state.code.message_id,
        undefined,
        [show ? `<code>${state.token}</code>` : undefined, 'Scan QR code in <b>Tookey Signer</b> to authenticate']
          .filter((s) => typeof s !== 'undefined')
          .join('\n'),
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: show ? 'Hide token' : 'Show as text', callback_data: BotAction.AUTH_SHOW_TOKEN_TOGGLE }],
              [{ text: 'Auth in Automation', url: this.flowsService.getAuthUrl(state.token) }],
            ],
          },
        },
      );
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @Action(new RegExp(`^${BotAction.AUTH_SHOW_TOKEN_TOGGLE}$`))
  async onToggleShowText(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const state = ctx.scene.state.auth;
    if (typeof state === 'undefined') {
      return;
    }

    state.showText = !state.showText;
    this.updateAuthCode(ctx);
  }
}
