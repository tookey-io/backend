import { KeyEvent } from 'apps/api/src/keys/keys.types';
import { formatDistanceToNow } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Ctx, InjectBot, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';
import { In, Not } from 'typeorm';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { KeyParticipantRepository, KeyRepository, TaskStatus } from '@tookey/database';

import { BotAction, BotScene } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { getPagination } from '../bot.utils';
import { BaseScene } from './base.scene';

@Scene(BotScene.KEYS)
export class KeysScene extends BaseScene {
  private readonly manageKeysKeyboard = (keys: { id: number; name: string }[], currentPage = 1, pageSize = 5) => {
    const totalPages = Math.ceil(keys.length / pageSize);

    const items = keys.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return Markup.inlineKeyboard([
      ...items.map((key) => [Markup.button.callback(`🔑 ${key.name}`, `${BotAction.KEY_MANAGE}${key.id}`)]),
      getPagination(currentPage, totalPages).map(({ text, data }) =>
        Markup.button.callback(text, `${BotAction.KEY_PAGE}${data}`),
      ),
    ]);
  };

  private async updateParticipationKeys(ctx: TookeyContext): Promise<void> {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    const keys = await this.participants.find({
      where: { userId: user.id, key: { status: Not(In([TaskStatus.Timeout, TaskStatus.Error])) } },
      relations: { key: true },
    });

    ctx.scene.state.keys = keys.map((participant) => ({ id: participant.keyId, name: participant.key.name }));
  }

  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(KeysScene.name) private readonly logger: PinoLogger,
    private readonly keys: KeyRepository,
    private readonly participants: KeyParticipantRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    await this.updateParticipationKeys(ctx);

    const newKeysKeyboard = () =>
      Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ Link a Key', BotAction.KEY_LINK),
          Markup.button.callback('➕ Create', BotAction.KEY_CREATE),
        ],
      ]);

    if (!ctx.scene.state.keys || !ctx.scene.state.keys.length) {
      await ctx.replyWithHTML(
        [
          '<b>You have no keys yet!</b>',
          '',
          'With <b>2K</b> you can generate distributed key and provide/revoke access to your key for any telegram user',
          'You will approve any transaction from third-party',
        ].join('\n'),
        newKeysKeyboard(),
      );
    } else {
      await ctx.replyWithHTML(`Select a key to manage:`, this.manageKeysKeyboard(ctx.scene.state.keys));
      await ctx.replyWithHTML(`Do you have any unlinked key or do you want create new one?`, newKeysKeyboard());
    }
  }

  @Action(new RegExp(`^${BotAction.KEY_CREATE}$`))
  async onCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.debug(ctx.scene.state);

    await ctx.replyWithHTML(
      [
        '<i>For futher interaction you will need <b>2KSigner</b>.</i>',
        '',
        "<b>2KSigner</b> is cross-platform application to interact with distributed keys. It's available for Desktop, iPhone and Android.",
      ].join('\n'),
      Markup.inlineKeyboard([Markup.button.url('🔗 Download', 'tookey.io/download')]),
    );
  }

  @Action(new RegExp(`^${BotAction.KEY_LINK}$`))
  async onLink(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.debug(ctx.scene.state);

    await ctx.replyWithHTML(
      [
        '<b>🎉 Hooray, early birds! 🐦</b>',
        '',
        `🚧 We're configuring linking key feature of Tookey... 🚧`,
        'We will send you notification when it ready to be your signer partner 🤗',
      ].join('\n'),
    );
  }

  @Action(new RegExp(`^${BotAction.KEY_MANAGE}\\d+$`))
  async onManage(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.debug(ctx.scene.state);

    const keyId = +this.getCallbackPayload(ctx, BotAction.KEY_MANAGE);

    if (!ctx.scene.state.keys) await this.updateParticipationKeys(ctx);

    const key = await this.keys.findOneBy({ id: keyId });
    const message: string[] = [`<b>${key.name}</b>`];

    if (key.description) message.push(key.description);
    if (key.tags) message.push(`Tags: ${key.tags.map((tag) => `#${tag}`).join(' ')}`);
    if (key.description || key.tags) message.push('');
    if (key.publicKey) message.push(`<code>${key.publicKey}</code>`);
    else message.push(`<code>Status: ${key.status}</code>`);

    message.push('');
    message.push(`Participants count: ${key.participantsCount}`);
    message.push(`Participants threshold: ${key.participantsThreshold}`);
    message.push(`Age: ${formatDistanceToNow(key.createdAt)}`);

    await ctx.replyWithHTML(message.join('\n'));
  }

  @Action(new RegExp(`^${BotAction.KEY_PAGE}\\d+$`))
  async onPagination(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const { message } = ctx.update.callback_query;

    const currentPage = +this.getCallbackPayload(ctx, BotAction.KEY_PAGE);

    this.logger.debug('Current page', currentPage);

    try {
      await this.bot.telegram.editMessageReplyMarkup(
        message.chat.id,
        message.message_id,
        undefined,
        this.manageKeysKeyboard(ctx.scene.state.keys, currentPage).reply_markup,
      );
    } catch (error) {
      this.logger.warn(error);
    }
  }

  @Action(new RegExp(`^${BotAction.KEY_CREATE_REQUEST}(approve|reject)$`))
  async onKeyCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const telegramUser = ctx.user;
    const { user } = telegramUser;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const decision = this.getCallbackPayload(ctx, BotAction.KEY_CREATE_REQUEST);

    this.eventEmitter.emit(KeyEvent.CREATE_RESPONSE, {
      isApproved: decision === 'approve',
      userId: user.id,
    });

    if (decision === 'approve') {
      ctx.replyWithHTML(['<b>✅ Key generation approved</b>'].join('\n'));
    }
    if (decision === 'reject') {
      ctx.replyWithHTML(['<b>⛔ Key generation rejected</b>'].join('\n'));
    }
  }
}
