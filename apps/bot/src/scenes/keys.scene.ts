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
import { KeyParticipantRepository, KeyRepository } from '@tookey/database';

import { TookeyContext } from '../bot.types';
import { getPagination } from '../bot.utils';

interface KeyParticipation {
  id: number;
  userIndex: number;
  name?: string;
}

@Scene(KeysScene.name)
export class KeysScene {
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
    keys: { id: number; name?: string }[],
    currentPage = 1,
    pageSize = 5,
  ) => {
    const totalPages = Math.ceil(keys.length / pageSize);

    const items = keys.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    const getKeyTitle = (id: number, name?: string) =>
      name ? `🔑 Key #${id} (${name})` : `🔑 Key #${id}`;

    return Markup.inlineKeyboard([
      ...items.map((key) => [
        Markup.button.callback(
          getKeyTitle(key.id, key.name),
          `manage:${key.id}`,
        ),
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

  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    private readonly accessService: AccessService,
    private readonly keys: KeyRepository,
    private readonly participants: KeyParticipantRepository,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TookeyContext, @Sender() from: tg.User) {
    this.logger.log('onSceneEnter');

    const userTelegram = ctx.user;
    const { user } = userTelegram;

    const keys = await this.participants.find({
      where: { userId: user.id },
      relations: { key: true },
    });

    this.participationKeys[from.id] = keys.map((participant, i) => ({
      id: i + 1,
      name: participant.key.name,
      userIndex: participant.index,
    }));

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
        this.manageKeysKeyboard(this.participationKeys[from.id]),
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
  async onManage(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.log('onManage');

    await ctx.answerCbQuery('test');
  }

  @Action(/pagination:(\d+)/)
  async onPagination(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.log('onPagination');

    const { data, from, message } = ctx.update.callback_query;

    const page = data.split(':')[1];

    try {
      await this.bot.telegram.editMessageReplyMarkup(
        message.chat.id,
        message.message_id,
        undefined,
        this.manageKeysKeyboard(this.participationKeys[from.id], +page)
          .reply_markup,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
