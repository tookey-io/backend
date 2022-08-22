import { User } from "@tookey/database/entities/user.entity"
import { Context, MiddlewareFn, Scenes } from "telegraf"


export type BotConfig = {
    token: string
}

export interface UserSession {
    user: User
}

export interface TelegrafMiddleware<C extends Context = Context> {
    use: MiddlewareFn<C>
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface Context extends Scenes.SceneContext {}
export interface TookeySceneSession extends Scenes.SceneSessionData {
    // custom scene session props
    state: {
        messages: number[]
    }
}

export interface TookeySession extends Scenes.SceneSession<TookeySceneSession> {
    // custom session props
}

// export type TookeyContext<U extends {} = {}> = Context & { update: U } & {
//     session: TookeySession
// }

export type TookeyContext<U extends {} = {}> = Scenes.SceneContext<TookeySceneSession> & { update: U }