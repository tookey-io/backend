import { KeysService } from 'apps/api/src/keys/keys.service';
import { UserService } from 'apps/api/src/user/user.service';
import { AppConfiguration } from 'apps/app/src/app.config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Ctx, Hears, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import * as tg from 'telegraf/types';

import { ConfigService } from '@nestjs/config';

import { BotAction, BotScene, USERNAME } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { BaseScene } from './base.scene';

@Scene(BotScene.KEY_SHARE)
export class KeyShareScene extends BaseScene {
  constructor(
    @InjectPinoLogger(KeyShareScene.name) private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly keysService: KeysService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {
    super();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    if (!ctx.scene.state.keyShare) return ctx.scene.leave();

    await ctx.replyWithHTML(
      [`Send us <code>@username</code> of the person you want to share the key with:`].join('\n'),
    );
  }

  @Hears(USERNAME)
  async onUsername(@Ctx() ctx: TookeyContext<tg.Update.MessageUpdate>) {
    this.logger.debug(ctx.match[0]);

    const username = ctx.match[0].slice(1);
    if (username === ctx.update.message.from.username) {
      return await ctx.replyWithHTML([`That's your current account 😟`].join('\n'));
    }

    const user = await this.userService.getTelegramUser({ username });
    if (!user) {
      await ctx.replyWithHTML(
        ['Consider to invite your partner to <b>Tookey</b>. Just forward next message:'].join('\n'),
      );

      const botName = this.configService.get('telegramBotName', { infer: true });
      const parameter = Buffer.from(`invite=${ctx.user.username}`).toString('base64').replace(/\=/g, '');

      await ctx.replyWithHTML(
        [
          `👋 Hello, @${username}!`,
          '',
          `We’re <b>Tookey</b> – asset and access management protocol.`,
          `Your mate @${ctx.user.username} decided to share partial access to owned crypto wallet.`,
          '',
          `To accept, please, follow the link below:`,
          `tg://resolve?domain=${botName}&start=${parameter}`,
        ].join('\n'),
      );

      await ctx.scene.leave();
    } else {
      ctx.scene.state.keyShare.username = username;

      await ctx.replyWithHTML(
        [`Nice. Now you can share this key with @${username}:`].join('\n'),
        Markup.inlineKeyboard([Markup.button.callback('🔁 Share key', `${BotAction.KEY_SHARE_USER}${user.userId}`)]),
      );
    }
  }

  @Action(new RegExp(`^${BotAction.KEY_SHARE_USER}\\d+$`))
  async onShare(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.debug(ctx.scene.state);
    const userId = +this.getCallbackPayload(ctx, BotAction.KEY_SHARE_USER);

    const { keyId, username } = ctx.scene.state.keyShare;

    await this.keysService.shareKey({ keyId, userId });

    await ctx.replyWithHTML(
      [
        `✅ Succeeded!`,
        '',
        `Now you need to pass the key file to @${username} so that he can add it to the <b>Signer Wallet</b>.`,
        `We have sent him further instructions.`,
      ].join('\n'),
    );
  }
}
