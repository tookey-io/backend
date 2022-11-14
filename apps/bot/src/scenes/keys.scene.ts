import { formatDistanceToNow } from 'date-fns';
import {
  Action,
  Ctx,
  InjectBot,
  Scene,
  SceneEnter,
  Sender,
} from 'nestjs-telegraf';
import * as QR from 'qrcode';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { Logger } from '@nestjs/common';
import { AccessService } from '@tookey/access';
import { Key, KeyParticipantRepository, KeyRepository } from '@tookey/database';

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
  private qrCode: tg.Message.PhotoMessage | undefined;

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
    if (timeLeft === 0) {
      await this.bot.telegram.deleteMessage(
        message.chat.id,
        this.qrCode.message_id,
      );
      this.qrCode = undefined;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!this.qrCode) return;

      await this.bot.telegram.editMessageCaption(
        message.chat.id,
        this.qrCode.message_id,
        undefined,
        `Removes in ${timeLeft} sec`,
        Markup.inlineKeyboard([Markup.button.callback('Delete', 'delete')]),
      );
      this.editOrDeleteQr(message, timeLeft - 1);
    }
  }

  private getKeyTitle(key: KeyParticipation) {
    return key.name ? `🔑 Key #${key.id} (${key.name})` : `🔑 Key #${key.id}`;
  }

  private async updateParticipationKeys(ctx: TookeyContext): Promise<void> {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    const keys = await this.participants.find({
      where: { userId: user.id },
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

  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    private readonly accessService: AccessService,
    private readonly keys: KeyRepository,
    private readonly participants: KeyParticipantRepository,
  ) {
    super();
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext, @Sender() from: tg.User) {
    this.logger.log('onSceneEnter');

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

  @Action(/create/)
  async onCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.log('onCreate');

    const userTelegram = ctx.user;
    const { user } = userTelegram;
    const { token } = await this.accessService.getAccessToken(user);
    const encoded = `tookey://access/${token}`;
    const qr = await QR.toBuffer(encoded);

    this.logger.log(token, 'token');

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

    await ctx.replyWithHTML(
      [
        'Scan QR code in <b>Tookey Signer</b> to link imported key or press a button:',
      ].join('\n'),
    );

    this.qrCode = await ctx.replyWithPhoto({ source: qr });

    this.editOrDeleteQr(ctx.update.callback_query.message, 60);
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

  @Action(/delete/)
  async onDelete(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.editOrDeleteQr(ctx.update.callback_query.message, 0);
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
      const info: string[] = [
        `<b>${this.getKeyTitle(keyParticipation)}</b>`,
        '',
      ];

      if (key.description) info.push(key.description);
      if (key.tags) info.push(key.tags.map((tag) => `#${tag}`).join(' '));

      if (key.description || key.tags) info.push('');

      if (key.publicKey) info.push(`<code>${key.publicKey}</code>`);
      else info.push(`Status: ${key.status}`);

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
}
