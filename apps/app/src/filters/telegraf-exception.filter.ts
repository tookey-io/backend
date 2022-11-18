import { TookeyContext } from 'apps/bot/src/bot.types';
import { ValidationException } from 'apps/bot/src/exceptions/validation.exception';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfiguration } from '../app.config';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(TelegrafExceptionFilter.name) private readonly logger: PinoLogger,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  public async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<TookeyContext>();

    if (exception instanceof ValidationException) {
      await ctx.reply(`${exception.message}`, { parse_mode: 'HTML' });
    } else {
      await ctx.reply(`<b>Error</b>: ${exception.message}`, { parse_mode: 'HTML' });
      await this.sendToExceptionsChat(ctx, exception);
      this.logger.error(exception);
    }
    await ctx.scene.leave();
  }

  private async sendToExceptionsChat(ctx: TookeyContext, exception: Error) {
    const chatId = this.configService.get('telegramExceptionsChatId', { infer: true });
    await ctx.telegram
      .sendMessage(chatId, `<i>${exception.stack}</i>`, { parse_mode: 'HTML' })
      .catch((error) => this.logger.error(error));
  }
}
