import { UserTelegram } from '@tookey/database';

declare module 'telegraf' {
  export interface Context {
    user: UserTelegram;
    // i18n: I18N
  }
}
