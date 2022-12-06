import { KeysService } from 'apps/api/src/keys/keys.service';
import { ShareableTokenService } from 'apps/api/src/shareable-token/shareable-token.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { format } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Ctx, Wizard, WizardStep } from 'nestjs-telegraf';

import { UseFilters } from '@nestjs/common';

import { BotScene } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { BaseScene } from '../scenes/base.scene';

@Wizard(BotScene.SHAREABLE_TOKEN_CREATE)
@UseFilters(TelegrafExceptionFilter)
export class ShareableTokenCreateScene extends BaseScene {
  constructor(
    @InjectPinoLogger(ShareableTokenCreateScene.name) private readonly logger: PinoLogger,
    private readonly keysService: KeysService,
    private readonly shareableTokenService: ShareableTokenService,
  ) {
    super();
  }

  @WizardStep(1)
  async stepName(@Ctx() ctx: TookeyContext) {
    const userTelegram = ctx.user;
    const { user } = userTelegram;
    ctx.wizard.state.shareableTokenCreate = {
      tokenName: null,
      selectedKeys: [],
      ttl: null,
    };

    await ctx.reply('To create a new Shareable Token, please send the name of the token you want to create.');

    const keys = await this.keysService.getKeyParticipationsByUser(user.id);
    ctx.wizard.state.keys = keys.filter((key) => key.isOwner);

    ctx.wizard.next();
  }

  @WizardStep(2)
  async stepKeys(@Ctx() ctx: TookeyContext) {
    if (!ctx.message.text.match(/^[a-zA-Z0-9\s]+$/)) {
      await ctx.reply(
        [
          'Sorry, that is not a valid token name.',
          'To create a new Shareable Token, please send me a name that contains only alphanumeric characters and spaces.',
        ].join('\n'),
      );
      return;
    }

    ctx.wizard.state.shareableTokenCreate = { tokenName: ctx.message.text };
    await ctx.reply(
      `Great! Now that you've selected the name for your new Shareable Token, please choose the keys you want to add to the token. Here are the available keys:`,
    );
    await ctx.reply(ctx.wizard.state.keys.map((key, i) => `${i + 1}. ${key.keyName}`).join('\n'));
    await ctx.reply(
      'To select a key, please reply with the number of the key you want to add to the token. You can add multiple keys to the token by separating the numbers with a comma.',
    );

    ctx.wizard.next();
  }

  @WizardStep(3)
  async stepTTL(@Ctx() ctx: TookeyContext) {
    if (!ctx.message.text.match(/^[0-9]+(,[0-9]+)*$/)) {
      await ctx.reply(
        'Please select at least one key for your token. To select a key, please reply with the number of the key you want to add to the token. You can add multiple keys to the token by separating the numbers with a comma.',
      );
      return;
    }

    ctx.wizard.state.shareableTokenCreate.selectedKeys = ctx.message.text.split(',').map(Number);

    await ctx.reply(`Great! You have selected the following keys for your new Shareable Token:`);
    await ctx.reply(
      ctx.wizard.state.shareableTokenCreate.selectedKeys
        .map((i) => `${i}. ${ctx.wizard.state.keys[i - 1].keyName}`)
        .join('\n'),
    );
    await ctx.reply(
      'Do you want to set a time to live (TTL) for this token? If you do, please specify the TTL in seconds. For example, to set a TTL of one hour, you would reply with "3600". To set the token to never expire, reply with "0".',
    );

    ctx.wizard.next();
  }

  @WizardStep(4)
  async stepSubmit(@Ctx() ctx: TookeyContext) {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    const ttl = parseInt(ctx.message.text, 10);

    if (ttl < 0) {
      await ctx.reply('Please provide a valid TTL in seconds.');
      return;
    }

    ctx.wizard.state.shareableTokenCreate.ttl = ttl;

    const name = ctx.wizard.state.shareableTokenCreate.tokenName;
    const keys = ctx.wizard.state.shareableTokenCreate.selectedKeys.map((i) => ctx.wizard.state.keys[i - 1].publicKey);
    const shareableToken = await this.shareableTokenService.createShareableToken(user.id, { name, keys, ttl });

    const validUntil = shareableToken.validUntil ? format(shareableToken.validUntil, 'MM/dd/yyyy') : null;

    await ctx.reply(
      'Great! Your new Shareable Token has been successfully created, and it will expire in one hour. Here are the details of the new token:',
    );
    await ctx.replyWithHTML(
      [
        `Token: <code>${shareableToken.token}</code>`,
        `Name: ${ctx.wizard.state.shareableTokenCreate.tokenName}`,
        `Keys: ${ctx.wizard.state.shareableTokenCreate.selectedKeys
          .map((i) => `${i}. ${ctx.wizard.state.keys[i - 1].keyName}`)
          .join(', ')}`,
        `Valid Until: ${validUntil || 'never expire'}`,
      ].join('\n'),
    );

    ctx.scene.leave();
  }
}
