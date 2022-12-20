import { Server, Socket } from 'socket.io';

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

import { RpsMoveUpdateDto, RpsRoomUpdateDto } from './rps.dto';
import { RpsService } from './rps.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RpsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly rpsService: RpsService) {}

  @SubscribeMessage('room-join')
  room(@MessageBody() data: RpsRoomUpdateDto, @ConnectedSocket() socket: Socket): WsResponse<unknown> {
    socket.join(data.roomId);
    const room = this.rpsService.updateRoom(data);
    socket.to(data.roomId).emit('room', room);
    return { event: 'room', data: room };
  }

  @SubscribeMessage('room-leave')
  roomLeave(@MessageBody() data: RpsRoomUpdateDto, @ConnectedSocket() socket: Socket): WsResponse<unknown> {
    socket.leave(data.roomId);
    const room = this.rpsService.leaveRoom(data);
    socket.to(data.roomId).emit('room', room);
    return { event: 'room', data: {} };
  }

  @SubscribeMessage('move')
  move(@MessageBody() dto: RpsMoveUpdateDto, @ConnectedSocket() socket: Socket): void {
    this.rpsService.playerMove(dto);
    setTimeout(() => {
      const status = this.rpsService.getState(dto.roomId);
      socket.to(dto.roomId).emit('status', status);
    }, 2000);
  }
}
