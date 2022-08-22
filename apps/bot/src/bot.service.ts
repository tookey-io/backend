import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegrafModuleOptions, TelegrafOptionsFactory } from "nestjs-telegraf";
import { session } from "telegraf";
import { BotConfig } from "./bot.types";
import { DefaultStateMiddleware } from "./middlewares/default-state.middleware";
import { TelegramUserMiddleware } from "./middlewares/telegram-user.middleware";

@Injectable()
export class BotService implements TelegrafOptionsFactory {
    constructor(
        private readonly configService: ConfigService<BotConfig>,
        private readonly telegramUser: TelegramUserMiddleware,
        private readonly defaultState: DefaultStateMiddleware,
    ) {
    }

    createTelegrafOptions(): TelegrafModuleOptions {
        console.log(this.telegramUser)
        return {
            token: this.configService.get('token', { infer: true }),
            middlewares: [
                session(),
                this.telegramUser.use.bind(this.telegramUser),
                this.defaultState.use.bind(this.defaultState)
            ]
        }
    }

}