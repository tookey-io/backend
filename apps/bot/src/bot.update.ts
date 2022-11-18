import { KeyCreateRequestDto, KeyDto, KeyParticipationDto, KeySignEventRequestDto } from 'apps/api/src/keys/keys.dto';
import { KeysService } from 'apps/api/src/keys/keys.service';
import { KeyEvent } from 'apps/api/src/keys/keys.types';
import { UserService } from 'apps/api/src/user/user.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { addSeconds, formatDistanceToNow } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Command, Ctx, Hears, InjectBot, Sender, Start, Update } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { UseFilters } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { BotAction, BotCommand, BotMenu, BotScene, CALLBACK_ACTION } from './bot.constants';
import { TookeyContext } from './bot.types';
import { getPagination } from './bot.utils';
import { ValidationException } from './exceptions/validation.exception';
import { BaseScene } from './scenes/base.scene';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate extends BaseScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(BotUpdate.name) private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    private readonly keysService: KeysService,
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
        ? Markup.inlineKeyboard([Markup.button.callback('🔁 Share with thirdparty', `${BotAction.KEY_SHARE}${keyId}`)])
        : undefined,
    );
  }

  @Action(new RegExp(`^${BotAction.KEY_SHARE}\\d+$`))
  async onKeyShare(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const keyId = +this.getCallbackPayload(ctx, BotAction.KEY_SHARE);
    ctx.scene.enter(BotScene.KEY_SHARE, { keyShare: { keyId } });
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

  @OnEvent(KeyEvent.CREATE_REQUEST)
  async onKeyCreateRequest(uuid: string, dto: KeyCreateRequestDto, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    const message = ['We are ready to start the key generation process. Do you approve this action?', ''];

    if (dto.name) message.push(`<code>Name: ${dto.name}</code>`);
    if (dto.description) message.push(`<code>Description: ${dto.description}</code>`);
    if (dto.tags) message.push(`<code>Tags: ${dto.tags.map((tag) => `#${tag}`).join(' ')}</code>`);

    if (dto.name || dto.description || dto.tags) message.push('');

    message.push(`<code>Participants Count: ${dto.participantsCount}</code>`);
    message.push(`<code>Participants Threshold: ${dto.participantsThreshold}</code>`);
    message.push(`<code>Timeout: ${dto.timeoutSeconds}s</code>`);

    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `${BotAction.KEY_CREATE_REQUEST}${uuid}approve` },
            { text: '⛔ Reject', callback_data: `${BotAction.KEY_CREATE_REQUEST}${uuid}reject` },
          ],
        ],
      },
    });
  }

  @OnEvent(KeyEvent.SIGN_REQUEST)
  async onKeySignRequest(uuid: string, dto: KeySignEventRequestDto, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    const message = [
      '<b>Signature request</b> from @',
      '',
      `<code>DATA: ${dto.data}</code>`,
      `<code>Expiration Time: ${addSeconds(new Date(), dto.timeoutSeconds)}</code>`,
    ];

    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `${BotAction.KEY_SIGN_REQUEST}${uuid}approve` },
            { text: '⛔ Reject', callback_data: `${BotAction.KEY_SIGN_REQUEST}${uuid}reject` },
          ],
        ],
      },
    });
  }

  @OnEvent(KeyEvent.CREATE_FINISHED)
  async onKeyCreateFinished(publicKey: string, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    const message = [`✅ <code>${publicKey}</code>`, '', 'Key has been generated!'];
    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), { parse_mode: 'HTML' });
    // ctx.replyWithHTML([
    //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
    //     '',
    //     'Key is linked to your telegram account. Onwer (@whoami) has been notified!'
    // ].join('\n'))
  }

  @OnEvent(KeyEvent.SIGN_FINISHED)
  async onKeySignFinished(keyName: string, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    await this.bot.telegram.sendMessage(telegramUser.chatId, `✅ Transaction signed with <b>${keyName}</b>`, {
      parse_mode: 'HTML',
    });
  }

  @OnEvent(KeyEvent.SHARE_RESPONSE)
  async onKeyShared(key: KeyDto, username: string, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    const message = [
      `🔑 @${username} shared the key <b>${key.name}</b> with you:`,
      '',
      `<code>${key.publicKey}</code>`,
      '',
      `If you haven't received any keys from @${username}, please consider to contact with user and ask for a key.`,
    ];

    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), { parse_mode: 'HTML' });
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
