import { UserService } from 'apps/api/src/user/user.service';
import { AppConfiguration } from 'apps/app/src/app.config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Ctx, Scene, SceneEnter, Sender } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import * as tg from 'telegraf/types';

import { ConfigService } from '@nestjs/config';
import { AccessService } from '@tookey/access';

import { BotScene } from '../bot.constants';
import { TookeyContext } from '../bot.types';

@Scene(BotScene.INIT)
export class InitScene {
  constructor(
    @InjectPinoLogger(InitScene.name) private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly accessService: AccessService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext, @Sender() from: tg.User) {
    this.logger.debug(ctx.scene.state);

    const userTelegram = ctx.user;

    if (userTelegram.user.fresh) {
      await ctx.replyWithHTML(
        [
          `<b>Hi, ${from.first_name}!</b>`,
          ``,
          `<b>Tookey</b> (2K in short) is security protocol designed to protect DeFi and Web3 from private key disclosure threats, inducting distributed key management and signing system`,
        ].join('\n'),
        Markup.inlineKeyboard([
          Markup.button.url('🔗 Official Website', 'tookey.io'),
          Markup.button.url('🔗 Documentation', 'tookey.io/docs'),
        ]),
      );

      await this.unfresh(ctx);
    } else {
      await ctx.replyWithHTML(
        `Hi, ${from.first_name}!`,
        !userTelegram.user.fresh
          ? undefined
          : Markup.inlineKeyboard([
              [
                Markup.button.url('🔗 Official Website', 'tookey.io'),
                Markup.button.url('🔗 Documentation', 'tookey.io/docs'),
              ],
            ]),
      );
    }

    if (ctx.scene.state.appAuth) {
      const userTelegram = ctx.user;
      const { user } = userTelegram;
      const { token } = await this.accessService.getAccessToken(user.id);
      const appUrl = this.configService.get('appUrl', { infer: true });
      const link = `${appUrl}/app/open?token=${token}`;

      await ctx.replyWithHTML(
        'Authenticate in <b>Tookey Signer</b>',
        Markup.inlineKeyboard([[Markup.button.url('✅ Sign with Telegram', link)]]),
      );
    } else {
      await ctx.scene.enter(BotScene.KEYS, ctx.scene.state);
    }
  }

  private async unfresh(ctx: TookeyContext): Promise<void> {
    const userTelegram = ctx.user;
    const { user } = userTelegram;
    user.fresh = false;
    await this.userService.updateUser(user.id, { fresh: false });
  }
}
