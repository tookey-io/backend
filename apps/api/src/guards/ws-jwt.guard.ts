import { Socket } from 'socket.io';

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard extends AuthGuard('ws-jwt') {
  getRequest(context: ExecutionContext): any {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      return client.handshake;
    } catch (err) {
      throw new WsException(err.message);
    }
  }
}
