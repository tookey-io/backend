import { User } from '@tookey/database/entities/user.entity'
import { Context } from 'telegraf'

declare module 'telegraf' {
  export interface Context {
    foo: string
    user: User
    // dbuser: User
    // i18n: I18N
  }
}