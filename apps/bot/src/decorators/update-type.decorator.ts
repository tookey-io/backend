import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UpdateType = createParamDecorator(
  (_, ctx: ExecutionContext) =>
    TelegrafExecutionContext.create(ctx).getContext().updateType,
);
