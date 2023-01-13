import { Observable, filter, fromEvent, map } from 'rxjs';
import { Server } from 'socket.io';

import { UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';

import { KeyEvent } from '../api.events';
import { WsCurrentUser } from '../decorators/current-user.decorator';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { WalletService } from './wallet.service';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WalletGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly walletService: WalletService, private readonly eventEmitter: EventEmitter2) {}

  @SubscribeMessage('wallet-create')
  roomJoin(@MessageBody() data: { roomId: string }, @WsCurrentUser() user: any): Observable<WsResponse<any>> {
    this.walletService.createWalletTss(data.roomId, user.id);
    return fromEvent(this.eventEmitter, KeyEvent.CREATE_FINISHED).pipe(
      filter((it) => it[1] === user.id),
      map((data) => ({ event: 'wallet-create', data: data[0] })),
    );
  }
}
