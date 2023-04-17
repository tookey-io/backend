export enum AuthEvent {
  SIGNIN = 'auth:signin',
}

export enum UserEvent {
  CREATE = 'user:create',
  CREATE_DISCORD = 'user:create:discord',
}

export enum KeyEvent {
  CREATE_REQUEST = 'key:create:request',
  CREATE_RESPONSE = 'key:create:response',
  CREATE_FINISHED = 'key:create:finished',
  SIGN_REQUEST = 'key:sign:request',
  SIGN_RESPONSE = 'key:sign:response',
  SIGN_FINISHED = 'key:sign:finished',
  SHARE_RESPONSE = 'key:share:response',
}

export enum WalletEvent {
  CREATE = 'wallet:create',
}
