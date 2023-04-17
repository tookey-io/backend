import { KeyEvent } from 'apps/api/src/api.events';
import { KeyCreateRequestDto, KeyDto, KeySignEventRequestDto } from 'apps/api/src/keys/keys.dto';
import { UserService } from 'apps/api/src/user/user.service';
import { addSeconds } from 'date-fns';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { OnEvent } from '@nestjs/event-emitter';

import { BotAction } from './bot.constants';
import { TookeyContext } from './bot.types';

export class BotEventHandler {
  constructor(@InjectBot() private readonly bot: Telegraf<TookeyContext>, private readonly userService: UserService) {}

  @OnEvent(KeyEvent.CREATE_REQUEST)
  async onKeyCreateRequest(uuid: string, dto: KeyCreateRequestDto, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
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
            { text: '✅ Approve', callback_data: `${BotAction.KEY_CREATE_REQUEST}${uuid}approve` },
            { text: '⛔ Reject', callback_data: `${BotAction.KEY_CREATE_REQUEST}${uuid}reject` },
          ],
        ],
      },
    });
  }

  @OnEvent(KeyEvent.SIGN_REQUEST)
  async onKeySignRequest(uuid: string, dto: KeySignEventRequestDto, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
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
            { text: '✅ Approve', callback_data: `${BotAction.KEY_SIGN_REQUEST}${uuid}approve` },
            { text: '⛔ Reject', callback_data: `${BotAction.KEY_SIGN_REQUEST}${uuid}reject` },
          ],
        ],
      },
    });
  }

  @OnEvent(KeyEvent.CREATE_FINISHED)
  async onKeyCreateFinished(publicKey: string, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    const message = [`✅ <code>${publicKey}</code>`, '', 'Key has been generated!'];
    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), { parse_mode: 'HTML' });
    // ctx.replyWithHTML([
    //     '✅ <code>0x87b2F4D0B3325D5e29E5d195164424b1135dF71B</code>',
    //     '',
    //     'Key is linked to your telegram account. Onwer (@whoami) has been notified!'
    // ].join('\n'))
  }

  @OnEvent(KeyEvent.SIGN_FINISHED)
  async onKeySignFinished(keyName: string, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    await this.bot.telegram.sendMessage(telegramUser.chatId, `✅ Transaction signed with <b>${keyName}</b>`, {
      parse_mode: 'HTML',
    });
  }

  @OnEvent(KeyEvent.SHARE_RESPONSE)
  async onKeyShared(key: KeyDto, username: string, userId: number) {
    const telegramUser = await this.userService.getTelegramUser({ userId });
    if (!telegramUser) return;

    const message = [
      `🔑 @${username} shared the key <b>${key.name}</b> with you:`,
      '',
      `<code>${key.publicKey}</code>`,
      '',
      `If you haven't received any keys from @${username}, please consider to contact with user and ask for a key.`,
    ];

    await this.bot.telegram.sendMessage(telegramUser.chatId, message.join('\n'), { parse_mode: 'HTML' });
  }
}
