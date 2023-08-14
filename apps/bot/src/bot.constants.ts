import { Markup } from 'telegraf';

export enum BotScene {
  INIT = 'init',
  AUTH = 'auth',
  KEY_SHARE = 'keyShare',
  KEY_DELETE = 'keyDelete',
  KEY_VERIFICATION = 'keyVerification',
  SHAREABLE_TOKEN_CREATE = 'shareableTokenCreate',
}

export enum BotCommand {
  AUTH = 'auth',
  KEYS = 'keys',
  SHAREABLE_TOKENS = 'tokens',
}

export enum BotAction {
  KEY_CREATE = 'key:create',
  KEY_LINK = 'key:link',
  KEY_MANAGE = 'key:manage:',
  KEY_PAGE = 'key:page:',
  KEY_CREATE_REQUEST = 'key:create:request:',
  KEY_SIGN_REQUEST = 'key:sign:request:',
  KEY_SHARE = 'key:share:',
  KEY_DELETE = 'key:delete:',
  KEY_DELETE_APPROVE = 'key:delete:approve:',
  KEY_DELETE_REJECT = 'key:delete:reject:',
  KEY_SHARE_USER = 'key:share:user:',
  KEY_VERIFICATION_FLOW = 'key:verification:',
  KEY_VERIFICATION_FLOW_SELECT = 'key:verification:select:',
  KEY_VERIFICATION_FLOW_REMOVE = 'key:verification:remove:',

  SHAREABLE_TOKEN_CREATE = 'shareable:create',
  SHAREABLE_TOKEN_MANAGE = 'shareable:manage:',
  SHAREABLE_TOKEN_PAGE = 'shareable:page:',
  SHAREABLE_TOKEN_DELETE = 'shareable:delete:',

  AUTH_SHOW_TOKEN_TOGGLE = 'auth:show:toggle',
}

export enum BotMenu {
  KEYS = '🔑 Keys',
  SHAREABLE_TOKENS = '🏷️ Shareable Tokens',
  CANCEL = '⬅️ Cancel',
}

export const mainKeyboard = Markup.keyboard([[BotMenu.KEYS, BotMenu.SHAREABLE_TOKENS]]).resize();

export const CALLBACK_ACTION = {
  KEY_CREATE_REQUEST: new RegExp(`^${BotAction.KEY_CREATE_REQUEST}(.{36})(approve|reject)$`),
  KEY_SIGN_REQUEST: new RegExp(`^${BotAction.KEY_SIGN_REQUEST}(.{36})(approve|reject)$`),
};

export const USERNAME = new RegExp('^@(?=[a-zA-Z0-9_]{4,32}$)(?!.*[_.]{2})[^_.].*[^_.]$');
