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
