import { KeysService } from 'apps/api/src/keys/keys.service';
import { ShareableTokenService } from 'apps/api/src/shareable-token/shareable-token.service';
import { TelegrafExceptionFilter } from 'apps/app/src/filters/telegraf-exception.filter';
import { format } from 'date-fns';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Action, Ctx, Hears, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';

import { UseFilters } from '@nestjs/common';

import { BotMenu, BotScene, mainKeyboard } from '../bot.constants';
import { TookeyContext } from '../bot.types';
import { BaseScene } from '../scenes/base.scene';
import { Message } from 'telegraf/types';

function storePrevious(ctx: TookeyContext, msg: Message.CommonMessage) {
  ctx.wizard.state.shareableTokenCreate?.previous?.push(msg);
}

function deletePrevious(ctx: TookeyContext) {
  if (ctx.wizard.state.shareableTokenCreate) {
    const msgs = [...ctx.wizard.state.shareableTokenCreate.previous];
    console.log('previous to delete', msgs);
    ctx.wizard.state.shareableTokenCreate.previous = [];
    if (msgs.length > 0) {
      return Promise.all(msgs.map((msg) => ctx.deleteMessage(msg.message_id)));
    }
  }
}

async function keySelection(ctx: TookeyContext) {
  storePrevious(
    ctx,
    await ctx.replyWithMarkdown(
      `**Great!  Now that you've selected *${ctx.wizard.state.shareableTokenCreate?.tokenName}* as name for your new **Shareable Token**, please choose the keys you want to add to the token. Here are the available keys:`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(`All`, ShareableTokenCreateSceneActions.SELECT_ALL_KEYS),
          Markup.button.callback(`None`, ShareableTokenCreateSceneActions.DESELECT_ALL_KEYS),
          Markup.button.callback('✅ Confirm', ShareableTokenCreateSceneActions.CONFIRM),
        ],
        ...ctx.wizard.state.keys.map((key) => {
          const selected = ctx.wizard.state.shareableTokenCreate.selectedKeys.includes(key.keyId);
          const emoji = selected ? '🟢' : '⚪';
          return [
            Markup.button.callback(
              `${emoji} ${key.keyName}`.padEnd(150, ' '),
              `${ShareableTokenCreateSceneActions.TOGGLE_KEY}${key.keyId}`,
            ),
          ];
        }),
      ]),
    ),
  );
}

enum ShareableTokenCreateSceneActions {
  TOGGLE_KEY = 'select_key',
  SELECT_ALL_KEYS = 'select_all_keys',
  DESELECT_ALL_KEYS = 'deselect_all_keys',
  CONFIRM = 'confirm',
  
}
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

  @Hears(new RegExp(`^${BotMenu.CANCEL}$`))
  async sceneLeave(@Ctx() ctx: TookeyContext) {
    this.logger.debug(ctx.scene.state);

    await ctx.reply('Canceled.', mainKeyboard);

    ctx.scene.leave();
  }

  @Action(new RegExp(`^${ShareableTokenCreateSceneActions.TOGGLE_KEY}`))
  async toggleKey(@Ctx() ctx: TookeyContext) {
    const keyId = this.getCallbackPayload(ctx, ShareableTokenCreateSceneActions.TOGGLE_KEY);

    const id = ctx.wizard.state.shareableTokenCreate?.selectedKeys?.indexOf(+keyId);
    if (id === -1) {
      ctx.wizard.state.shareableTokenCreate?.selectedKeys?.push(+keyId);
    } else if (typeof id !== 'undefined') {
      ctx.wizard.state.shareableTokenCreate?.selectedKeys?.splice(id, 1);
    }

    await Promise.all([deletePrevious(ctx), keySelection(ctx)]);
  }

  @WizardStep(1)
  async stepName(@Ctx() ctx: TookeyContext) {
    const userTelegram = ctx.user;
    const { user } = userTelegram;

    ctx.wizard.state.shareableTokenCreate = {
      tokenName: null,
      selectedKeys: [],
      ttl: null,
      previous: [],
    };

    const sceneKeyboard = Markup.keyboard([[BotMenu.CANCEL]]).resize();

    storePrevious(
      ctx,
      await ctx.reply(
        'To create a new Shareable Token, please send the name of the token you want to create.',
        sceneKeyboard,
      ),
    );

    const keys = await this.keysService.getKeyParticipationsByUser(user.id);
    ctx.wizard.state.keys = keys.filter((key) => key.isOwner);

    ctx.wizard.next();
  }

  @WizardStep(2)
  async stepKeys(@Ctx() ctx: TookeyContext) {
    storePrevious(ctx, ctx.message);

    if (!ctx.message.text.match(/^[a-zA-Z0-9\-]+$/)) {
      storePrevious(
        ctx,
        await ctx.reply(
          [
            'Sorry, that is not a valid token name.',
            'To create a new Shareable Token, please send me a name that contains only alphanumeric characters and dashes .',
          ].join('\n'),
        ),
      );
      return;
    }

    await deletePrevious(ctx);

    ctx.wizard.state.shareableTokenCreate.tokenName = ctx.message.text;

    await keySelection(ctx);

    await ctx.wizard.next();
  }
  @WizardStep(3)
  async stepWaitKeys(@Ctx() ctx: TookeyContext) {
    console.log('do noting');
  }

  @WizardStep(4)
  async stepTTL(@Ctx() ctx: TookeyContext) {
    if (!ctx.message.text.match(/^[0-9]+(,[0-9]+)*$/)) {
      await ctx.reply(
        'Please select at least one key for your token. To select a key, please reply with the number of the key you want to add to the token. You can add multiple keys to the token by separating the numbers with a comma.',
      );
      return;
    }

    // ctx.wizard.state.shareableTokenCreate.selectedKeys = ctx.message.text.split(',').map(Number);

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

  @WizardStep(5)
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

    const validUntil = shareableToken.validUntil ? format(shareableToken.validUntil, 'MM/dd/yyyy') : 'never expire';

    await ctx.reply(
      'Great! Your new Shareable Token has been successfully created, and it will expire in one hour. Here are the details of the new token:',
    );
    await ctx.replyWithHTML(
      [
        `<b>${shareableToken.name}</b>`,
        `<code>${shareableToken.token}</code>`,
        '',
        `Keys: ${ctx.wizard.state.shareableTokenCreate.selectedKeys
          .map((i) => ctx.wizard.state.keys[i - 1].keyName)
          .join(', ')}`,
        `Valid Until: ${validUntil}`,
      ].join('\n'),
      mainKeyboard,
    );

    ctx.scene.leave();
  }
}
