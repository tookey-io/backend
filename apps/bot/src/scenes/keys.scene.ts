import { KeyCreateRequestDto } from 'apps/api/src/keys/keys.dto';
import { KeyEvent } from 'apps/api/src/keys/keys.types';
import { formatDistanceToNow } from 'date-fns';
import {
  Action,
  Command,
  Ctx,
  InjectBot,
  Scene,
  SceneEnter,
  Sender,
} from 'nestjs-telegraf';
import * as QR from 'qrcode';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';
import { Not } from 'typeorm';

import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AccessService } from '@tookey/access';
import {
  Key,
  KeyParticipantRepository,
  KeyRepository,
  TaskStatus,
  UserTelegramRepository,
} from '@tookey/database';

import { TookeyContext } from '../bot.types';
import { getPagination } from '../bot.utils';
import { BaseScene } from './base.scene';

interface KeyParticipation {
  id: number;
  keyId: number;
  userIndex: number;
  name?: string;
}

@Scene(KeysScene.name)
export class KeysScene extends BaseScene {
  private readonly logger = new Logger(KeysScene.name);

  private participationKeys: Record<string, KeyParticipation[]> = {};
  private qrCodes: Record<number, tg.Message.PhotoMessage> = {};

  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    private readonly accessService: AccessService,
    private readonly keys: KeyRepository,
    private readonly participants: KeyParticipantRepository,
    private readonly telegramUsers: UserTelegramRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext, @Sender() from: tg.User) {
    this.logger.log('onSceneEnter');
    await this.replyWithKeys(ctx, from);
  }

  @Command('/keys')
  async keysList(@Ctx() ctx: TookeyContext, @Sender() from: tg.User) {
    await this.replyWithKeys(ctx, from);
  }

  @Command('/auth')
  async authCode(@Ctx() ctx: TookeyContext<tg.Update.MessageUpdate>) {
    const userTelegram = ctx.user;
    const { user } = userTelegram;
    const { token } = await this.accessService.getAccessToken(user.id);
    const encoded = `tookey://access/${token}`;
    const qr = await QR.toBuffer(encoded);

    this.logger.debug(token, 'token');

    await ctx.deleteMessage(ctx.message.message_id);

    if (!this.qrCodes[userTelegram.telegramId]) {
      this.qrCodes[userTelegram.telegramId] = await ctx.replyWithPhoto({
        source: qr,
      });
      this.editOrDeleteQr(ctx.update.message, 60);
    }
  }

  @Action(/create/)
  async onCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.log('onCreate');

    await ctx.replyWithHTML(
      [
        '<i>For futher interaction you will need <b>2KSigner</b>.</i>',
        '',
        "<b>2KSigner</b> is cross-platform application to interact with distributed keys. It's available for Desktop, iPhone and Android.",
      ].join('\n'),
      Markup.inlineKeyboard([
        Markup.button.url('🔗 Download', 'tookey.io/download'),
      ]),
    );
  }

  @Action(/link/)
  async onLink(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.log('onLink');

    await ctx.replyWithHTML(
      [
        '<b>🎉 Hooray, early birds! 🐦</b>',
        '',
        `🚧 We're configuring linking key feature of Tookey... 🚧`,
        'We will send you notification when it ready to be your signer partner 🤗',
      ].join('\n'),
    );
  }

  @Action(/manage:(\d+)/)
  async onManage(
    @Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>,
    @Sender() from: tg.User,
  ) {
    this.logger.log('onManage');

    const keyId = +this.getCallbackPayload(ctx, 'manage:');

    if (!this.participationKeys[from.id]) {
      await this.updateParticipationKeys(ctx);
    }

    const keyParticipation = this.participationKeys[from.id].find(
      (participantKey) => participantKey.keyId === keyId,
    );

    const keyData = await this.keys.findOneBy({ id: keyId });

    const buildHTMLKeyData = (key: Key): string => {
      const info: string[] = [`<b>${this.getKeyTitle(keyParticipation)}</b>`];

      if (key.description) info.push(key.description);
      if (key.tags) {
        info.push(`Tags: ${key.tags.map((tag) => `#${tag}`).join(' ')}`);
      }

      if (key.description || key.tags) info.push('');

      if (key.publicKey) info.push(`<code>${key.publicKey}</code>`);
      else info.push(`<code>Status: ${key.status}</code>`);

      return [
        ...info,
        '',
        `Participants count: ${key.participantsCount}`,
        `Participants threshold: ${key.participantsThreshold}`,
        `Age: ${formatDistanceToNow(key.createdAt)}`,
      ].join('\n');
    };

    await ctx.replyWithHTML(buildHTMLKeyData(keyData));
  }

  @Action(/pagination:(\d+)/)
  async onPagination(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.log('onPagination');

    const { from, message } = ctx.update.callback_query;

    const currentPage = +this.getCallbackPayload(ctx, 'pagination:');

    try {
      await this.bot.telegram.editMessageReplyMarkup(
        message.chat.id,
        message.message_id,
        undefined,
        this.manageKeysKeyboard(this.participationKeys[from.id], currentPage)
          .reply_markup,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Action(/keyCreate:(.*)/)
  async onKeyCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const telegramUser = ctx.user;
    const { user } = telegramUser;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const decision = this.getCallbackPayload(ctx, 'keyCreate:');

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

  @OnEvent(KeyEvent.CREATE_REQUEST)
  async onKeyCreateRequest(dto: KeyCreateRequestDto, userId: number) {
    const telegramUser = await this.telegramUsers.findOneBy({ userId });
    if (!telegramUser) return;

    const message = [
      'We are ready to start the key generation process. Do you approve this action?',
      '',
    ];

    if (dto.name) {
      message.push(`<code>Name: ${dto.name}</code>`);
    }
    if (dto.description) {
      message.push(`<code>Description: ${dto.description}</code>`);
    }
    if (dto.tags) {
      message.push(
        `<code>Tags: ${dto.tags.map((tag) => `#${tag}`).join(' ')}</code>`,
      );
    }

    if (dto.name || dto.description || dto.tags) message.push('');

    message.push(`<code>Participants Count: ${dto.participantsCount}</code>`);
    message.push(
      `<code>Participants Threshold: ${dto.participantsThreshold}</code>`,
    );
    message.push(`<code>Timeout: ${dto.timeoutSeconds}s</code>`);

    await this.bot.telegram.sendMessage(
      telegramUser.chatId,
      message.join('\n'),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: 'keyCreate:approve' },
              { text: '⛔ Reject', callback_data: 'keyCreate:reject' },
            ],
          ],
        },
      },
    );
  }

  private newKeysKeyboard = () =>
    Markup.inlineKeyboard([
      [
        Markup.button.callback('➕ Link a Key', 'link'),
        Markup.button.callback('➕ Create', 'create'),
      ],
    ]);

  private manageKeysKeyboard = (
    keys: KeyParticipation[],
    currentPage = 1,
    pageSize = 5,
  ) => {
    const totalPages = Math.ceil(keys.length / pageSize);

    const items = keys.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return Markup.inlineKeyboard([
      ...items.map((key) => [
        Markup.button.callback(this.getKeyTitle(key), `manage:${key.keyId}`),
      ]),
      getPagination(currentPage, totalPages).map(({ text, data }) =>
        Markup.button.callback(text, `pagination:${data}`),
      ),
    ]);
  };

  private async editOrDeleteQr(
    message: tg.Message,
    timeLeft: number,
  ): Promise<void> {
    const qrCode = this.qrCodes[message.chat.id];

    if (qrCode && timeLeft === 0) {
      await this.bot.telegram.deleteMessage(message.chat.id, qrCode.message_id);
      delete this.qrCodes[message.chat.id];
      return;
    }

    if (qrCode) {
      await this.bot.telegram.editMessageCaption(
        message.chat.id,
        qrCode.message_id,
        undefined,
        [
          'Scan QR code in <b>Tookey Signer</b> to authenticate',
          `Removes in ${timeLeft} sec`,
        ].join('\n'),
        { parse_mode: 'HTML' },
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.editOrDeleteQr(message, timeLeft - 1);
    }
  }

  private getKeyTitle(key: KeyParticipation) {
    return key.name ? `🔑 Key #${key.id} [${key.name}]` : `🔑 Key #${key.id}`;
  }

  private async updateParticipationKeys(ctx: TookeyContext): Promise<void> {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    const keys = await this.participants.find({
      where: { userId: user.id, key: { status: Not(TaskStatus.Timeout) } },
      relations: { key: true },
    });

    this.participationKeys[userTelegram.telegramId] = keys.map(
      (participant, i) => ({
        id: i + 1,
        keyId: participant.keyId,
        name: participant.key.name,
        userIndex: participant.index,
      }),
    );
  }

  private async replyWithKeys(ctx: TookeyContext, from: tg.User) {
    await this.updateParticipationKeys(ctx);

    const keys = this.participationKeys[from.id];

    if (!keys.length) {
      await ctx.replyWithHTML(
        [
          '<b>You have no keys yet!</b>',
          '',
          'With <b>2K</b> you can generate distributed key and provide/revoke access to your key for any telegram user',
          'You will approve any transaction from third-party',
        ].join('\n'),
        this.newKeysKeyboard(),
      );
    } else {
      await ctx.replyWithHTML(
        `Select a key to manage:`,
        this.manageKeysKeyboard(keys),
      );

      await ctx.replyWithHTML(
        `Do you have any unlinked key or do you want create new one?`,
        this.newKeysKeyboard(),
      );
    }
  }
}
