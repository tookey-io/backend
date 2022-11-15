export enum KeyEvent {
  CREATE_REQUEST = 'key.create.request',
  CREATE_RESPONSE = 'key.create.response',
}

export const CREATE_RESPONSE_TYPE = ['approve', 'reject'] as const;
export type KeyCreateResponseType = typeof CREATE_RESPONSE_TYPE[number];
