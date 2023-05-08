import { KeyParticipationDto } from 'apps/api/src/keys/keys.dto';
import { ShareableTokenDto } from 'apps/api/src/shareable-token/shareable-token.dto';
import { TelegramUserDto } from 'apps/api/src/user/user-telegram.dto';
import { Context, MiddlewareFn, Scenes } from 'telegraf';
import * as tg from 'telegraf/types';
import { Deunionize } from 'telegraf/typings/deunionize';
import { WizardContext, WizardSessionData } from 'telegraf/typings/scenes';

export type BotConfig = {
  telegramToken: string;
};

export interface UserSession {
  user: TelegramUserDto;
}

export interface TelegrafMiddleware<C extends Context = Context> {
  use: MiddlewareFn<C>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface Context extends Scenes.SceneContext {}
export interface TookeySceneSession extends Scenes.SceneSessionData {
  // custom scene session props
  state: {
    appAuth?: boolean;
    auth?: {
      token: string;
      code: tg.Message.PhotoMessage;
      showText: boolean;
      timeLeft: number;
    };
    invitedBy?: string;
    keys?: KeyParticipationDto[];
    keyShare?: {
      keyId?: number;
      username?: string;
    };
    keyDelete?: {
      keyId?: number;
    };
    shareableTokens?: ShareableTokenDto[];
  };

  cursor: number;
}

export interface TookeyWizardSession extends WizardSessionData {
  // custom scene session props
  state: {
    shareableTokenCreate?: {
      tokenName?: string;
      selectedKeys?: number[];
      ttl?: number;
    };
    keys?: KeyParticipationDto[];
  };

  cursor: number;
}

export type TookeyContext<
  U extends Deunionize<tg.Update> = tg.Update,
  M extends Deunionize<tg.Message> = tg.Message,
> = Context<U> &
  Scenes.SceneContext<TookeySceneSession> &
  WizardContext<TookeyWizardSession> & {
    message: M & { text: string };
    scene: TookeySceneSession;
    wizard: TookeyWizardSession;
    update: U;
    startPayload: string;
    match?: string[];
  };
