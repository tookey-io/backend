import { Observable, filter, fromEvent, map, tap } from 'rxjs';
import { Server, Socket } from 'socket.io';

import { UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

import { KeyEvent } from '../api.events';
import { WsCurrentUser } from '../decorators/current-user.decorator';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { UserContextDto } from '../user/user.dto';
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
  roomJoin(
    @MessageBody('roomId') roomId: string,
    @WsCurrentUser() user: UserContextDto,
    @ConnectedSocket() socket: Socket,
  ): Observable<WsResponse<any>> {
    this.walletService.createWalletTss(roomId, user.id);
    socket.join(roomId);
    return fromEvent(this.eventEmitter, KeyEvent.CREATE_FINISHED).pipe(
      filter((it) => it[1] === user.id),
      tap((data) => console.log(`${data}`)),
      map((data) => {
        const publicKey = data[0];
        socket.to(roomId).emit('wallet-create', publicKey);
        return { event: 'wallet-create', data: publicKey };
      }),
    );
  }
}
