// import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
// import { SetMetadata, applyDecorators } from '@nestjs/common';

// export const AMQP_SUBSCRIBE = 'AMQP_SUBSCRIBE';

// export const AmqpSubscribe = (config: Parameters<typeof RabbitSubscribe>) =>
//   applyDecorators(
//     RabbitSubscribe(...config),
//     SetMetadata(AMQP_SUBSCRIBE, true),
//   );

export {
  RabbitSubscribe as AmqpSubscribe,
  RabbitPayload as AmqpPayload,
} from '@golevelup/nestjs-rabbitmq';
