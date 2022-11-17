import { TelegramUserDto } from 'apps/api/src/user/user-telegram.dto';

declare module 'telegraf' {
  export interface Context {
    user: TelegramUserDto;
    // i18n: I18N
  }
}
