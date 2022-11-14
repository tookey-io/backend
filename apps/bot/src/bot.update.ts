import { Action, Ctx, Sender, Start, Update } from 'nestjs-telegraf';
import * as tg from 'telegraf/types';

import { Logger } from '@nestjs/common';
import { UserRepository, UserTelegramRepository } from '@tookey/database';

import { TookeyContext } from './bot.types';
import { MenuScene } from './scenes/menu.scene';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly users: UserRepository,
    private readonly usersTelegram: UserTelegramRepository,
  ) {}

  @Action(/activate/)
  async onActivate(
    @Ctx() ctx: TookeyContext,
    // @Sender() sender: tg.User,
  ) {
    this.logger.log('onActivate');
    this.logger.log(JSON.stringify(ctx.scene.state), 'onActivate');
    ctx.replyWithHTML(['test'].join('\n'));
  }

  @Start()
  async onStart(@Ctx() ctx: TookeyContext, @Sender() sender: tg.User) {
    this.logger.log('onStart');
    this.logger.log(ctx.scene.state);
    this.logger.log(ctx.session);

    if (ctx.chat.id != sender.id) {
      return `Hi, ${sender.first_name}! Go to @tookey_bot to manage your keys`;
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
    await ctx.scene.enter(MenuScene.name);
  }

  @Action(/approve/)
  onApprove(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    ctx.deleteMessage(ctx.update.callback_query.message!.message_id);
    ctx.replyWithHTML(
      [
        '<b>✅ Approved signature request</b> from @alerdenisov',
        'Ethereum Signed Message',
        'request on <i>Planet IX</i> (planetix.com)',
        '',
        'Content:',
        '<code>URI: https://planetix.com/connect</code>',
        '<code>Web3 Token Version: 2</code>',
        '<code>Nonce: 40293536</code>',
        '<code>Issued At: 2022-08-22T19:28:25.431Z</code>',
        '<code>Expiration Time: 2022-08-23T19:28:25.000Z</code>',
      ].join('\n'),
    );
  }
}
