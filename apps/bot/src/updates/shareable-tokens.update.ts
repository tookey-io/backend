import { ShareableTokenService } from 'apps/api/src/shareable-token/shareable-token.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { format } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Command, Ctx, Hears, InjectBot, Update } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { UseFilters } from '@nestjs/common';

import { ShareableTokenDto } from '../../../api/src/shareable-token/shareable-token.dto';
import { BotAction, BotCommand, BotMenu, BotScene } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { getPagination, replaceMiddle } from '../bot.utils';
import { BaseScene } from '../scenes/base.scene';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class ShareableTokensUpdate extends BaseScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(ShareableTokensUpdate.name) private readonly logger: PinoLogger,
    private readonly shareableTokenService: ShareableTokenService,
  ) {
    super();
    this.handleError();
  }

  @Command(BotCommand.SHAREABLE_TOKENS)
  async shareableTokensList(@Ctx() ctx: TookeyContext) {
    await this.onMenuShareableTokens(ctx);
  }

  @Hears(new RegExp(`^${BotMenu.SHAREABLE_TOKENS}$`))
  async onMenuShareableTokens(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    await this.updateShareableTokens(ctx);

    const newShareableTokensKeyboard = () =>
      Markup.inlineKeyboard([[Markup.button.callback('➕ Create Token', BotAction.SHAREABLE_TOKEN_CREATE)]]);

    if (!ctx.scene.state.shareableTokens || !ctx.scene.state.shareableTokens.length) {
      await ctx.replyWithHTML('<b>You have no Shareable Tokens yet!</b>');
      await ctx.replyWithHTML(
        'By using Shareable Tokens, you can grant or revoke access to use your keys the Tookey API. These tokens can have a specified time limit and can include multiple keys.',
        newShareableTokensKeyboard(),
      );
    } else {
      await ctx.replyWithHTML(
        `Select Shareable Token to manage:`,
        this.manageShareableTokensKeyboard(ctx.scene.state.shareableTokens),
      );
      await ctx.replyWithHTML(`Do you want create new Shareable Token?`, newShareableTokensKeyboard());
    }
  }

  @Action(new RegExp(`^${BotAction.SHAREABLE_TOKEN_CREATE}$`))
  async onCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.debug(ctx.scene.state);

    await ctx.scene.enter(BotScene.SHAREABLE_TOKEN_CREATE);
  }

  @Action(new RegExp(`^${BotAction.SHAREABLE_TOKEN_MANAGE}\\d+$`))
  async onManage(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    this.logger.debug(ctx.scene.state);

    const tokenId = +this.getCallbackPayload(ctx, BotAction.SHAREABLE_TOKEN_MANAGE);

    if (!ctx.scene.state.shareableTokens) await this.updateShareableTokens(ctx);

    const token = ctx.scene.state.shareableTokens.find((token) => token.id === tokenId);

    const shareableToken = await this.shareableTokenService.getShareableToken(token.token);
    const message: string[] = [`<b>${shareableToken.name}</b>`];

    if (shareableToken.token) message.push(`<code>${shareableToken.token}</code>`);
    if (shareableToken.description) message.push(shareableToken.description);
    if (shareableToken.keys) message.push(`Keys: ${shareableToken.keys.map((key) => key.name).join(', ')}`);

    const validUntil = shareableToken.validUntil ? format(shareableToken.validUntil, 'MM/dd/yyyy') : null;

    message.push('');
    message.push(`Valid Until: ${validUntil || 'never expire'}`);

    await ctx.replyWithHTML(
      message.join('\n'),
      Markup.inlineKeyboard([
        Markup.button.callback('❌ Delete token', `${BotAction.SHAREABLE_TOKEN_DELETE}${shareableToken.id}`),
      ]),
    );
  }

  @Action(new RegExp(`^${BotAction.SHAREABLE_TOKEN_DELETE}\\d+$`))
  async onDelete(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    const id = +this.getCallbackPayload(ctx, BotAction.SHAREABLE_TOKEN_DELETE);

    await this.shareableTokenService.delete({ id }, user.id);
    await this.updateShareableTokens(ctx);

    await ctx.reply('Token sucessesfullty deleted!');
  }

  private readonly manageShareableTokensKeyboard = (
    shareableTokens: ShareableTokenDto[],
    currentPage = 1,
    pageSize = 5,
  ) => {
    const totalPages = Math.ceil(shareableTokens.length / pageSize);

    const items = shareableTokens.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return Markup.inlineKeyboard([
      ...items.map((token) => [
        Markup.button.callback(this.getTokenName(token), `${BotAction.SHAREABLE_TOKEN_MANAGE}${token.id}`),
      ]),
      getPagination(currentPage, totalPages).map(({ text, data }) =>
        Markup.button.callback(text, `${BotAction.SHAREABLE_TOKEN_PAGE}${data}`),
      ),
    ]);
  };

  @Action(new RegExp(`^${BotAction.SHAREABLE_TOKEN_PAGE}\\d+$`))
  async onPagination(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const { message } = ctx.update.callback_query;

    const currentPage = +this.getCallbackPayload(ctx, BotAction.SHAREABLE_TOKEN_PAGE);

    this.logger.debug('Current page', currentPage);

    try {
      await this.bot.telegram.editMessageReplyMarkup(
        message.chat.id,
        message.message_id,
        undefined,
        this.manageShareableTokensKeyboard(ctx.scene.state.shareableTokens, currentPage).reply_markup,
      );
    } catch (error) {
      this.logger.warn(error);
    }
  }

  private async updateShareableTokens(ctx: TookeyContext): Promise<void> {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    ctx.scene.state.shareableTokens = await this.shareableTokenService.getShareableTokensByUser(user.id);
  }

  private getTokenName(token: ShareableTokenDto): string {
    return token.name ? `🏷️ ${token.name}` : `🏷️ ${replaceMiddle(token.token)}`;
  }

  private handleError(): void {
    this.bot.catch((err: any) => this.logger.error(err));
  }
}
