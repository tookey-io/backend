export enum BotScene {
  INIT = 'init',
  AUTH = 'auth',
  KEYS = 'keys',
}

export enum BotCommand {
  AUTH = 'auth',
  KEYS = 'keys',
}

export enum BotAction {
  KEY_CREATE = 'key:create',
  KEY_LINK = 'key:link',
  KEY_MANAGE = 'key:manage:',
  KEY_PAGE = 'key:page:',
  KEY_CREATE_REQUEST = 'key:create:request:',
  KEY_SIGN_REQUEST = 'key:sign:request:',
}

export enum BotMenu {
  KEYS = '🔑 Keys',
}

export const CALLBACK_ACTION = {
  KEY_CREATE_REQUEST: new RegExp(`^${BotAction.KEY_CREATE_REQUEST}(.{36})(approve|reject)$`),
  KEY_SIGN_REQUEST: new RegExp(`^${BotAction.KEY_SIGN_REQUEST}(.{36})(approve|reject)$`),
};
