import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AmqpService {
  constructor(private readonly amqp: AmqpConnection) {}

  publish<T = any>(exchange: string, routingKey: string, message: T): void {
    this.amqp.publish(exchange, routingKey, message);
  }
}
