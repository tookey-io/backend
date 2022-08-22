import { Action, Ctx, Sender, Start, Update } from "nestjs-telegraf";
import * as tg from 'telegraf/types';

import { User, UserRepository } from "@tookey/database/entities/user.entity";
import { MenuScene } from "./scenes/menu.scene";
import { TookeyContext } from "./bot.types";
import { Markup } from "telegraf";

@Update()
export class BotUpdate {
    constructor(
        private readonly users: UserRepository
    ) { }

    @Start()
    async onStart(
        @Ctx() context: TookeyContext<tg.Update.MessageUpdate>,
        @Sender() sender: tg.User
    ) {
        if (!context.user) {
            // create new user (how to solve intitation in future?)
            const root = await this.users.findRoot();
            console.log('root', root)
            const user = new User();

            user.telegramUserId = sender.id;
            user.telegramBaseChatId = context.chat.id;

            if (!root) {
                console.log("User is root")
            } else {
                user.parent = root
            }

            context.user = await this.users.save(user)
        }

        if (context.chat.id != sender.id) {
            return `Hi, ${sender.first_name}! Go to @tookey_bot to manage your keys`
        }

        if (context.session.__scenes.current) {
            await context.scene.leave()
        }

        // Remote /start command from chat
        await context.deleteMessage(context.message.message_id);
        // console.log(context.scene.enter)
        // context.replyWithHTML([
        //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
        //     '',
        //     'Key is linked to your telegram account. Onwer (@whoami) has been notified!'
        // ].join('\n'))


        // context.replyWithHTML([
        //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
        //     '',
        //     'Key has been generated!'
        // ].join('\n'))

        await new Promise(resolve => setTimeout(resolve, 5000));

        context.replyWithHTML([
            '<b>Signature request</b> from @alerdenisov',
            'Ethereum Signed Message',
            'request on <i>Planet IX</i> (planetix.com)',
            '',
            'Content:',
            '<code>URI: https://planetix.com/connect</code>',
            '<code>Web3 Token Version: 2</code>',
            '<code>Nonce: 40293536</code>',
            '<code>Issued At: 2022-08-22T19:28:25.431Z</code>',
            '<code>Expiration Time: 2022-08-23T19:28:25.000Z</code>',
        ].join('\n'), Markup.inlineKeyboard([
            [Markup.button.callback('✅ Approve', 'approve'), Markup.button.callback('⛔ Reject', 'Reject')]
        ]))
        // await context.scene.enter(MenuScene.ID);
    }

    @Action(/approve/)
    onApprove(
        @Ctx() context: TookeyContext<tg.Update.CallbackQueryUpdate>,
    ) {
        context.deleteMessage(context.update.callback_query.message!.message_id);
        context.replyWithHTML([
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
        ].join('\n'))
    }
}