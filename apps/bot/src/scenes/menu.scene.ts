import { UserRepository } from '@tookey/database/entities/user.entity';
import { Action, Ctx, Scene, SceneEnter, SceneLeave, Sender } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import * as tg from 'telegraf/types';
import { TookeyContext } from '../bot.types';
import { KeysScene } from './keys.scene';
import { storeMsgFn } from './scene.utils';

@Scene(MenuScene.ID)
export class MenuScene {
    static ID = 'menu'

    constructor(private readonly users: UserRepository) { }

    @SceneLeave()
    async onLeave(@Ctx() ctx: TookeyContext) {

    }

    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: TookeyContext, @Sender() from: tg.User) {
        console.log(ctx.scene.state)

        const storeId = storeMsgFn(ctx)
        const user = ctx.user;

        const messages: number[] = [];

        if (user.isFresh) {
            storeId(await ctx.replyWithHTML(
                [
                    `<b>Hi, ${from.first_name}!</b>`,
                    ``,
                    `<b>Tookey</b> (2K in short) is security protocol designed to protect DeFi and Web3 from private key disclosure threats, inducting distributed key management and signing system`,
                ].join('\n'),
                Markup.inlineKeyboard([
                    Markup.button.url('🔗 Official Website', 'tookey.io'),
                    Markup.button.url('🔗 Documentation', 'tookey.io/docs'),
                ]),
            ));

            await this.unfresh(ctx);
        } else {
            storeId(await ctx.replyWithHTML(
                `Hi, ${from.first_name}!`,
                !user.isFresh
                    ? undefined
                    : Markup.inlineKeyboard([
                        [
                            Markup.button.url('🔗 Official Website', 'tookey.io'),
                            Markup.button.url('🔗 Documentation', 'tookey.io/docs'),
                        ],
                    ]),
            ));
        }

        await ctx.scene.enter(KeysScene.ID, ctx.scene.state)
    }

    private async unfresh(ctx: TookeyContext) {
        ctx.user.fresh = false;
        await this.users.save(ctx.user);
    }
}
