import { KeySignEventRequestDto } from 'apps/api/src/keys/keys.dto';
import { KeyEvent } from 'apps/api/src/keys/keys.types';
import { addSeconds } from 'date-fns';
import { Action, Ctx, InjectBot, Sender, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserTelegramRepository } from '@tookey/database';

import { TookeyContext } from './bot.types';
import { BaseScene } from './scenes/base.scene';
import { MenuScene } from './scenes/menu.scene';

@Update()
export class BotUpdate extends BaseScene {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    private readonly eventEmitter: EventEmitter2,
    private readonly telegramUsers: UserTelegramRepository,
  ) {
    super();
  }

  @Start()
  async onStart(@Ctx() ctx: TookeyContext, @Sender() sender: tg.User) {
    this.logger.log('onStart');

    if (ctx.chat.id != sender.id) {
      return `Hi, ${sender.first_name}! Go to @tookey_bot to manage your keys`;
    }

    const initialState: Record<string, any> = {};

    // https://t.me/tookey_bot?start=YXBwPWF1dGg
    if (ctx.startPayload) {
      const encoded = Buffer.from(ctx.startPayload, 'base64')
        .toString('ascii')
        .split('=');
      if (encoded[0] === 'app' && encoded[1] === 'auth') {
        initialState.appAuth = true;
      }
    }

    if (ctx.session.__scenes.current) {
      await ctx.scene.leave();
    }

    // Remove /start command from chat
    // await ctx.deleteMessage(ctx.message.message_id);
    // this.logger.log(ctx.scene.enter)

    // ctx.replyWithHTML([
    //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
    //     '',
    //     'Key is linked to your telegram account. Onwer (@whoami) has been notified!'
    // ].join('\n'))

    // ctx.replyWithHTML([
    //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
    //     '',
    //     'Key has been generated!'
    // ].join('\n'))

    // await new Promise((resolve) => setTimeout(resolve, 5000));

    // ctx.replyWithHTML(
    //   [
    //     '<b>Signature request</b> from @alerdenisov',
    //     'Ethereum Signed Message',
    //     'request on <i>Planet IX</i> (planetix.com)',
    //     '',
    //     'Content:',
    //     '<code>URI: https://planetix.com/connect</code>',
    //     '<code>Web3 Token Version: 2</code>',
    //     '<code>Nonce: 40293536</code>',
    //     '<code>Issued At: 2022-08-22T19:28:25.431Z</code>',
    //     '<code>Expiration Time: 2022-08-23T19:28:25.000Z</code>',
    //   ].join('\n'),
    //   Markup.inlineKeyboard([
    //     [
    //       Markup.button.callback('✅ Approve', 'approve'),
    //       Markup.button.callback('⛔ Reject', 'Reject'),
    //     ],
    //   ]),
    // );
    await ctx.scene.enter(MenuScene.name, initialState);
  }

  @Action(/keySign:(.*)/)
  async onKeyCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const telegramUser = ctx.user;
    const { user } = telegramUser;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const decision = this.getCallbackPayload(ctx, 'keySign:');

    this.eventEmitter.emit(KeyEvent.SIGN_RESPONSE, {
      isApproved: decision === 'approve',
      userId: user.id,
    });

    if (decision === 'approve') {
      ctx.replyWithHTML(
        ['<b>✅ Approved signature request</b> from @'].join('\n'),
      );
    }
    if (decision === 'reject') {
      ctx.replyWithHTML(['<b>⛔ Rejected</b>'].join('\n'));
    }
  }

  @OnEvent(KeyEvent.SIGN_REQUEST)
  async onKeySignRequest(dto: KeySignEventRequestDto, userId: number) {
    const telegramUser = await this.telegramUsers.findOneBy({ userId });
    if (!telegramUser) return;

    const message = [
      '<b>Signature request</b> from @',
      '',
      `<code>DATA: ${dto.data}</code>`,
      `<code>Expiration Time: ${addSeconds(
        new Date(),
        dto.timeoutSeconds,
      )}</code>`,
    ];

    await this.bot.telegram.sendMessage(
      telegramUser.chatId,
      message.join('\n'),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: 'keySign:approve' },
              { text: '⛔ Reject', callback_data: 'keySign:reject' },
            ],
          ],
        },
      },
    );
  }
}
