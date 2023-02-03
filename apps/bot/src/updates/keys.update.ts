import { KeyEvent } from 'apps/api/src/api.events';
import { KeyParticipationDto } from 'apps/api/src/keys/keys.dto';
import { KeysService } from 'apps/api/src/keys/keys.service';
import { UserService } from 'apps/api/src/user/user.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { formatDistanceToNow } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Command, Ctx, Hears, InjectBot, Update } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { UseFilters } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BotAction, BotCommand, BotMenu, BotScene, CALLBACK_ACTION } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { getPagination } from '../bot.utils';
import { BaseScene } from '../scenes/base.scene';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class KeysUpdate extends BaseScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(KeysUpdate.name) private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    private readonly keysService: KeysService,
  ) {
    super();
    this.handleError();
  }

  @Command(BotCommand.KEYS)
  async keysList(@Ctx() ctx: TookeyContext) {
    await this.onMenuKeys(ctx);
  }

  @Hears(new RegExp(`^${BotMenu.KEYS}$`))
  async onMenuKeys(@Ctx() ctx: TookeyContext) {
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

    const key = await this.keysService.getKey({ id: keyId });
    const message: string[] = [`<b>${key.name}</b>`];

    if (key.description) message.push(key.description);
    if (key.tags) message.push(`Tags: ${key.tags.map((tag) => `#${tag}`).join(' ')}`);
    if (key.description || key.tags) message.push('');
    if (key.publicKey) message.push(`<code>${key.publicKey}</code>`);
    else message.push(`<code>Status: ${key.status}</code>`);

    message.push('');
    message.push(`Participants count: ${key.participantsCount}`);
    message.push(`Participants threshold: ${key.participantsThreshold}`);
    message.push(`Age: ${formatDistanceToNow(new Date(key.createdAt))}`);

    const isOwner = ctx.user.userId === key.userId;
    if (isOwner) {
      const keyTelegramUsers = await this.keysService.getTelegramUsersByKey(keyId);
      const shared = keyTelegramUsers
        .filter(({ userId }) => userId !== key.userId)
        .map(({ username }) => `@${username}`)
        .join(' ');
      message.push(`Shared with: ${shared ? shared : 'nobody'}`);
    } else {
      const owner = await this.userService.getTelegramUser({ userId: key.userId });
      if (owner.username) message.push(`Key owner: @${owner.username}`);
    }

    await ctx.replyWithHTML(
      message.join('\n'),
      isOwner
        ? Markup.inlineKeyboard([
            [Markup.button.callback('🔁 Share with thirdparty', `${BotAction.KEY_SHARE}${keyId}`)],
            [Markup.button.callback('❌ Delete', `${BotAction.KEY_DELETE}${keyId}`)],
          ])
        : undefined,
    );
  }

  @Action(new RegExp(`^${BotAction.KEY_SHARE}\\d+$`))
  async onKeyShare(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const keyId = +this.getCallbackPayload(ctx, BotAction.KEY_SHARE);
    ctx.scene.enter(BotScene.KEY_SHARE, { keyShare: { keyId } });
  }

  @Action(new RegExp(`^${BotAction.KEY_DELETE}\\d+$`))
  async onKeyDelete(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const keyId = +this.getCallbackPayload(ctx, BotAction.KEY_DELETE);
    ctx.scene.enter(BotScene.KEY_DELETE, { keyDelete: { keyId } });
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

  @Action(CALLBACK_ACTION.KEY_CREATE_REQUEST)
  async onKeyCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const telegramUser = ctx.user;
    const { user } = telegramUser;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const [, uuid, answer] = this.getCallbackData(ctx).match(CALLBACK_ACTION.KEY_CREATE_REQUEST);

    this.eventEmitter.emit(KeyEvent.CREATE_RESPONSE, { uuid, isApproved: answer === 'approve', userId: user.id });

    if (answer === 'approve') ctx.replyWithHTML('<b>✅ Key generation approved</b>');
    if (answer === 'reject') ctx.replyWithHTML('<b>⛔ Key generation rejected</b>');
  }

  @Action(CALLBACK_ACTION.KEY_SIGN_REQUEST)
  async onKeySign(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const telegramUser = ctx.user;
    const { user } = telegramUser;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const [, uuid, answer] = this.getCallbackData(ctx).match(CALLBACK_ACTION.KEY_SIGN_REQUEST);

    this.eventEmitter.emit(KeyEvent.SIGN_RESPONSE, { uuid, isApproved: answer === 'approve', userId: user.id });

    if (answer === 'approve') ctx.replyWithHTML('<b>✅ Approved signature request</b> from @');
    if (answer === 'reject') ctx.replyWithHTML('<b>⛔ Rejected</b>');
  }

  private readonly manageKeysKeyboard = (keys: KeyParticipationDto[], currentPage = 1, pageSize = 5) => {
    const totalPages = Math.ceil(keys.length / pageSize);

    const items = keys.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return Markup.inlineKeyboard([
      ...items.map((key) => [
        Markup.button.callback(
          `🔑 ${key.keyName}${!key.isOwner ? ' (shared)' : ''}`,
          `${BotAction.KEY_MANAGE}${key.keyId}`,
        ),
      ]),
      getPagination(currentPage, totalPages).map(({ text, data }) =>
        Markup.button.callback(text, `${BotAction.KEY_PAGE}${data}`),
      ),
    ]);
  };

  private async updateParticipationKeys(ctx: TookeyContext): Promise<void> {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    ctx.scene.state.keys = await this.keysService.getKeyParticipationsByUser(user.id);
  }

  private handleError(): void {
    this.bot.catch((err: any) => this.logger.error(err));
  }
}
