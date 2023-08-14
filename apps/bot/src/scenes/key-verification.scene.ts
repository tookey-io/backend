import { KeysService } from 'apps/api/src/keys/keys.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';

import { UseFilters } from '@nestjs/common';

import { BotAction, BotScene, mainKeyboard } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { BaseScene } from '../scenes/base.scene';
import { FlowsService } from '@tookey/flows';
import { AccessService } from '@tookey/access';

@Scene(BotScene.KEY_VERIFICATION)
@UseFilters(TelegrafExceptionFilter)
export class keyVerificationScene extends BaseScene {
  constructor(
    @InjectPinoLogger(keyVerificationScene.name) private readonly logger: PinoLogger,
    private readonly keysService: KeysService,
    private readonly flowsService: FlowsService,
    private readonly accessService: AccessService,
  ) {
    super();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    const keyId = ctx.scene.state.keyVerification?.keyId;
    if (!keyId) return ctx.scene.leave();

    ctx.scene.state.keyVerification.message = await ctx.replyWithHTML('Loading key verification details...');

    await this.showState(ctx);
  }

  private async showState(ctx: TookeyContext) {
    const { message, keyId } = ctx.scene.state.keyVerification;
    if (!keyId) return ctx.scene.leave();

    const [key, flows, otp] = await Promise.all([
      this.keysService.getKey({ id: keyId }),
      this.flowsService.getUserVerificationFlows({ id: ctx.user.id.toString() }),
      this.accessService.getAccessToken(ctx.user.id),
    ]);

    const [, newMessage] = await Promise.all([
      message ? ctx.telegram.deleteMessage(message.chat.id, message.message_id) : Promise.resolve(),
      ctx.telegram.sendMessage(
        ctx.chat.id,
        `
**Key Verification Details**
Automation flow is **${key.verificationHook ? 'enabled' : 'disabled'}**
    `,
        {
          parse_mode: 'MarkdownV2',
          ...Markup.inlineKeyboard([
            ...flows.map((flow) => [
              Markup.button.callback(
                (key.verificationHook === flow.id ? '🟢' : '⚪') + ' ' + flow.version.displayName,
                `${BotAction.KEY_VERIFICATION_FLOW_SELECT}${flow.id}`,
              ),
              Markup.button.url('Edit', this.flowsService.getAuthEndEditUrl(flow.id, otp.token)),
            ]),
            [Markup.button.callback('Remove', BotAction.KEY_VERIFICATION_FLOW_REMOVE)],
          ]),
        },
      ),
    ]);

    ctx.scene.state.keyVerification.message = newMessage;
  }

  @Action(new RegExp(`^${BotAction.KEY_VERIFICATION_FLOW_REMOVE}$`))
  async onFlowRemove(@Ctx() ctx: TookeyContext) {
    const keyId = ctx.scene.state.keyVerification?.keyId;
    if (!keyId) return ctx.scene.leave();

    const [key] = await Promise.all([
      this.keysService.getKey({ id: keyId }),
      // this.flowsService.getUserVerificationFlows({ id: ctx.user.id.toString() }),
      // this.accessService.getAccessToken(ctx.user.id),
    ]);

    await this.keysService.updateVerification(key);

    await this.showState(ctx);
  }

  @Action(new RegExp(`^${BotAction.KEY_VERIFICATION_FLOW_SELECT}`))
  async onFlowSelect(@Ctx() ctx: TookeyContext) {
    const keyId = ctx.scene.state.keyVerification?.keyId;
    if (!keyId) return ctx.scene.leave();

    const [key] = await Promise.all([
      this.keysService.getKey({ id: keyId }),
      // this.flowsService.getUserVerificationFlows({ id: ctx.user.id.toString() }),
      // this.accessService.getAccessToken(ctx.user.id),
    ]);

    const flowId = this.getCallbackPayload(ctx, BotAction.KEY_VERIFICATION_FLOW_SELECT);
    this.logger.info(`Set flow ` + flowId);
    await this.keysService.updateVerification(key, flowId);
    await this.showState(ctx);
  }
}
