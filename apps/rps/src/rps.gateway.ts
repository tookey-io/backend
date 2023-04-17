import { Server, Socket } from 'socket.io';

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

import {
  RpsGameState,
  RpsPlayerCommitDto,
  RpsPlayerJoinDto,
  RpsPlayerLeaveDto,
  RpsPlayerRevealDto,
  RpsStatus,
} from './rps.dto';
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
  roomJoin(@MessageBody() data: RpsPlayerJoinDto, @ConnectedSocket() socket: Socket): WsResponse<RpsGameState> {
    const { roomId, playerId } = data;
    socket.join(roomId);
    const players = this.rpsService.join(roomId, playerId);
    const status = Object.keys(players).length > 1 ? RpsStatus.Start : RpsStatus.Wait;
    const roomState: RpsGameState = { players, roomId, status };
    socket.to(roomId).emit('rps-state', roomState);
    return { event: 'rps-state', data: roomState };
  }

  @SubscribeMessage('room-leave')
  roomLeave(@MessageBody() data: RpsPlayerLeaveDto, @ConnectedSocket() socket: Socket): WsResponse<RpsGameState> {
    const { roomId, playerId } = data;
    socket.leave(roomId);
    const players = this.rpsService.leave(roomId, playerId);
    const status = Object.keys(players).length > 1 ? RpsStatus.Start : RpsStatus.Wait;
    const roomState: RpsGameState = { players, roomId, status };
    socket.to(roomId).emit('rps-state', roomState);
    return { event: 'room', data: {} };
  }

  @SubscribeMessage('commit')
  async commit(
    @MessageBody() data: RpsPlayerCommitDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<WsResponse<RpsGameState>> {
    const { roomId, playerId, commitment } = data;
    const players = this.rpsService.commit({ roomId, playerId, commitment });
    await this.rpsService.syncInProgress();
    const status = this.rpsService.isAllPlayersCommitted(data.roomId) ? RpsStatus.Reveal : RpsStatus.Commit;
    const roomState: RpsGameState = { players, roomId, status };
    socket.to(roomId).emit('rps-state', roomState);
    return { event: 'rps-state', data: roomState };
  }

  @SubscribeMessage('reveal')
  async reveal(
    @MessageBody() data: RpsPlayerRevealDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<WsResponse<RpsGameState>> {
    const { roomId, playerId, choice, nonce } = data;
    const players = this.rpsService.reveal({ roomId, playerId, choice, nonce });
    await this.rpsService.syncInProgress();
    const status = this.rpsService.isAllPlayersRevealed(data.roomId) ? RpsStatus.Finished : RpsStatus.Fail;
    const roomState: RpsGameState = { players, roomId, status };
    if (status === RpsStatus.Finished) {
      const winners = this.rpsService.getWinners(roomId);
      roomState.winners = winners;
      socket.leave(roomId);
    }
    socket.to(roomId).emit('rps-state', roomState);
    return { event: 'rps-state', data: roomState };
  }
}
