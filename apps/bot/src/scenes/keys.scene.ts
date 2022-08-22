import { UserRepository } from '@tookey/database/entities/user.entity';
import {
    Action,
    Ctx,
    InjectBot,
    Scene,
    SceneEnter,
    Sender,
} from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import { User } from 'telegraf/types';
import { TookeyContext } from '../bot.types';
import * as tg from 'telegraf/types';
import { AccessService } from 'libs/access/src';
import * as QR from 'qrcode';

@Scene(KeysScene.ID)
export class KeysScene {
    static ID = 'keys';

    private newKeysKeyboard = () =>
        Markup.inlineKeyboard([
            [
                Markup.button.callback('➕ Link a Key', 'link'),
                Markup.button.callback('➕ Create', 'link'),
            ],
        ]);

    private manageKeysKeyboard = (keys: any[]) =>
        Markup.inlineKeyboard(
            [1, 2, 3, 4].map((id) => [
                Markup.button.callback(`🔑 Key #${id + 1}`, `manage:${id}`),
            ]),
        );

    constructor(
        @InjectBot() private readonly bot: Telegraf<TookeyContext>,
        private readonly users: UserRepository,
        private readonly accessService: AccessService,
    ) { }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: TookeyContext, @Sender() from: User) {
        const user = ctx.user;

        if (!user.keys.length) {
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
                this.manageKeysKeyboard(user.keys),
            );

            await ctx.replyWithHTML(
                `Do you have any unlinked key or do you want create new one?`,
                this.newKeysKeyboard(),
            );
        }
    }

    @Action(/create/)
    async onCreate(@Ctx() ctx: TookeyContext) {
        await ctx.replyWithHTML(
            [
                '<b>🎉 Hooray, early birds! 🐦</b>',
                '',
                `🚧 We're configuring or production ready vaults to store Tookey's parts of distributed key... 🚧`,
                'We will send you notification when it ready to be your signer partner 🤗',
            ].join('\n'),
        );
    }

    @Action(/link/)
    async onLink(@Ctx() ctx: TookeyContext) {
        const user = ctx.user;
        const token = await this.accessService.getAccessToken(user);
        const encoded = `tookey://access/${token.token}`;
        const qr = await QR.toBuffer(encoded);

        await ctx.replyWithHTML([
            '<i>For futher interaction you will need <b>2KSigner</b>.</i>',
            '',
            '<b>2KSigner</b> is cross-platform application to interact with distributed keys. It\'s available for Desktop, iPhone and Android.'
        ].join('\n'), Markup.inlineKeyboard([
            Markup.button.url("🔗 Download", "tookey.io/download")
        ]))

        await ctx.replyWithHTML([
            'Scan QR code in <b>Tookey Signer</b> to link imported key or press a button:'
        ].join("\n"))

        const timeleft = 60;
        const temporalPhoto = await ctx.replyWithPhoto({ source: qr });

        const editOrDelete = async (left: number) => {
            if (left == 0) {
                console.log('delete photo');
                await this.bot.telegram.deleteMessage(
                    user.telegramUserId,
                    temporalPhoto.message_id,
                );
            } else {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await this.bot.telegram.editMessageCaption(
                    user.telegramUserId,
                    temporalPhoto.message_id,
                    undefined,
                    `Removes in ${left} sec`,
                    Markup.inlineKeyboard([Markup.button.callback('Delete', 'delete')]),
                );
                editOrDelete(left - 1);
            }
        };

        editOrDelete(timeleft - 1);
    }

    @Action(/manage:(\d+)/)
    async onManage(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
        await ctx.answerCbQuery('test');
    }
}
