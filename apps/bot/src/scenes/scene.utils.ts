import { TookeyContext } from "../bot.types";

export const storeMsgFn = (ctx: TookeyContext) => ({ message_id }: { message_id: number }) => {} //ctx.scene.session.state.messages.push(message_id)