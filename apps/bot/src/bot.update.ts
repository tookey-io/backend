import { KeyCreateRequestDto, KeySignEventRequestDto } from 'apps/api/src/keys/keys.dto';
import { KeyEvent } from 'apps/api/src/keys/keys.types';
import { addSeconds } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Command, Ctx, InjectBot, Sender, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserTelegramRepository } from '@tookey/database';

import { BotAction, BotCommand, BotScene } from './bot.constants';
import { TookeyContext } from './bot.types';
import { BaseScene } from './scenes/base.scene';

@Update()
export class BotUpdate extends BaseScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<TookeyContext>,
    @InjectPinoLogger(BotUpdate.name) private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly telegramUsers: UserTelegramRepository,
  ) {
    super();
    this.handleError();
  }

  @Start()
  async onStart(@Ctx() ctx: TookeyContext, @Sender() sender: tg.User) {
    if (ctx.chat.id != sender.id) return `Hi, ${sender.first_name}! Go to @tookey_bot to manage your keys`;
    if (ctx.session.__scenes.current) await ctx.scene.leave();

    // https://t.me/tookey_bot?start=YXBwPWF1dGg
    if (ctx.startPayload) {
      const encoded = Buffer.from(ctx.startPayload, 'base64').toString('ascii').split('=');
      if (encoded[0] === 'app' && encoded[1] === 'auth') ctx.scene.state.appAuth = true;
    }

    await ctx.scene.enter(BotScene.INIT, ctx.scene.state);
  }

  @Command(BotCommand.AUTH)
  async authCode(@Ctx() ctx: TookeyContext<tg.Update.MessageUpdate>) {
    await ctx.scene.enter(BotScene.AUTH);
  }

  @Command(BotCommand.KEYS)
  async keysList(@Ctx() ctx: TookeyContext) {
    await ctx.scene.enter(BotScene.KEYS);
  }

  @Action(new RegExp(`^${BotAction.KEY_SIGN_REQUEST}(approve|reject)$`))
  async onKeyCreate(@Ctx() ctx: TookeyContext<tg.Update.CallbackQueryUpdate>) {
    const telegramUser = ctx.user;
    const { user } = telegramUser;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const answer = this.getCallbackPayload(ctx, BotAction.KEY_SIGN_REQUEST);

    this.eventEmitter.emit(KeyEvent.SIGN_RESPONSE, { isApproved: answer === 'approve', userId: user.id });

    if (answer === 'approve') ctx.replyWithHTML(['<b>✅ Approved signature request</b> from @'].join('\n'));
    if (answer === 'reject') ctx.replyWithHTML(['<b>⛔ Rejected</b>'].join('\n'));
  }

  @OnEvent(KeyEvent.SIGN_REQUEST)
  async onKeySignRequest(dto: KeySignEventRequestDto, userId: number) {
    const telegramUser = await this.telegramUsers.findOneBy({ userId });
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
            {
              text: '✅ Approve',
              callback_data: `${BotAction.KEY_SIGN_REQUEST}approve`,
            },
            {
              text: '⛔ Reject',
              callback_data: `${BotAction.KEY_SIGN_REQUEST}reject`,
            },
          ],
        ],
      },
    });
  }

  @OnEvent(KeyEvent.CREATE_REQUEST)
  async onKeyCreateRequest(dto: KeyCreateRequestDto, userId: number) {
    const telegramUser = await this.telegramUsers.findOneBy({ userId });
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
            { text: '✅ Approve', callback_data: `${BotAction.KEY_CREATE_REQUEST}approve` },
            { text: '⛔ Reject', callback_data: `${BotAction.KEY_CREATE_REQUEST}reject` },
          ],
        ],
      },
    });
  }

  @OnEvent(KeyEvent.SIGN_FINISHED)
  async onKeySignFinished(keyName: string, userId: number) {
    const telegramUser = await this.telegramUsers.findOneBy({ userId });
    if (!telegramUser) return;

    const message = [`✅ Transaction signed with <b>${keyName}</b>`];
    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), { parse_mode: 'HTML' });
  }

  @OnEvent(KeyEvent.CREATE_FINISHED)
  async onKeyCreateFinished(publicKey: string, userId: number) {
    const telegramUser = await this.telegramUsers.findOneBy({ userId });
    if (!telegramUser) return;

    const message = [`✅ <code>${publicKey}</code>`, '', 'Key has been generated!'];
    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), { parse_mode: 'HTML' });
    // ctx.replyWithHTML([
    //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
    //     '',
    //     'Key is linked to your telegram account. Onwer (@whoami) has been notified!'
    // ].join('\n'))
  }

  private handleError(): void {
    this.bot.catch((err: any) => this.logger.error(err));
  }
}
