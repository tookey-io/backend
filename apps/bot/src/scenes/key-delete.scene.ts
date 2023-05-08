import { KeysService } from 'apps/api/src/keys/keys.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';

import { UseFilters } from '@nestjs/common';

import { BotAction, BotScene, mainKeyboard } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { BaseScene } from '../scenes/base.scene';

@Scene(BotScene.KEY_DELETE)
@UseFilters(TelegrafExceptionFilter)
export class KeyDeleteScene extends BaseScene {
  constructor(
    @InjectPinoLogger(KeyDeleteScene.name) private readonly logger: PinoLogger,
    private readonly keysService: KeysService,
  ) {
    super();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    if (!ctx.scene.state.keyDelete) return ctx.scene.leave();

    await ctx.replyWithHTML(
      `Are you sure?`,
      Markup.inlineKeyboard([Markup.button.callback('❌ Delete', BotAction.KEY_DELETE_APPROVE)]),
    );
  }

  @Action(new RegExp(`^${BotAction.KEY_DELETE_APPROVE}$`))
  async onDelete(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    const { keyId } = ctx.scene.state.keyDelete;

    await this.keysService.softDelete({ id: keyId });

    await ctx.reply('✅ Succeeded!', mainKeyboard);

    ctx.scene.leave();
  }

  @Action(new RegExp(`^${BotAction.KEY_DELETE_REJECT}\\d+$`))
  async sceneLeave(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    delete ctx.scene.state.keyDelete;

    await ctx.reply('Canceled.', mainKeyboard);

    ctx.scene.leave();
  }
}
