import { Queue } from 'bull';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';

import { ALL, RPS_QUEUE } from './rps.constants';
import { Moves, RpsMoveUpdateDto, RpsRoomDto, RpsRoomUpdateDto, RpsStateResponseDto } from './rps.dto';

@Injectable()
export class RpsService {
  rooms = new Map<string, RpsRoomDto>();

  constructor(
    @InjectPinoLogger(RpsService.name) private readonly logger: PinoLogger,
    @InjectQueue(RPS_QUEUE) private readonly rpsQueue: Queue<RpsMoveUpdateDto>,
  ) {}

  updateRoom(dto: RpsRoomUpdateDto): RpsRoomDto {
    if (!this.rooms.has(dto.roomId)) this.rooms.set(dto.roomId, { [`${dto.address}`]: 0 });
    else {
      const room = this.rooms.get(dto.roomId);
      this.rooms.set(dto.roomId, { ...room, [`${dto.address}`]: 0 });
    }
    return this.rooms.get(dto.roomId);
  }

  leaveRoom(dto: RpsRoomUpdateDto): RpsRoomDto {
    if (!this.rooms.has(dto.roomId)) return null;
    const room = this.rooms.get(dto.roomId);
    if (!room[dto.address]) return null;

    delete room[dto.address];
    this.rooms.set(dto.roomId, room);
    return room;
  }

  getRoom(roomId: string, address: string): RpsRoomDto {
    if (!this.rooms.has(roomId)) return null;
    const room = this.rooms.get(roomId);
    if (!room[address]) return null;
    return room;
  }

  async playerMove(dto: RpsMoveUpdateDto): Promise<void> {
    const jobId = `${dto.roomId}:${dto.address}`;
    await this.rpsQueue.add('player-move', dto, { jobId });
  }

  updateState(dto: RpsMoveUpdateDto): void {
    if (!this.rooms.has(dto.roomId)) return null;
    const room = this.rooms.get(dto.roomId);
    this.rooms.set(dto.roomId, { ...room, [dto.address]: dto.move });
  }

  getState(roomId: string): RpsStateResponseDto {
    if (!this.rooms.has(roomId)) {
      throw new BadRequestException('');
    }
    const room = this.rooms.get(roomId);
    const players = Object.keys(room);
    const moves = Object.values(room);
    const isAllMoved = Object.values(room).every((move) => move > 0);
    if (!isAllMoved) return { status: 'started' };

    const winners = this.draw(moves);

    const movesResponse = moves.reduce((acc, cur, i) => {
      return { ...acc, [players[i]]: cur };
    }, {} as { [address: string]: number });

    const winnersResponse = winners.reduce((acc, cur, i) => {
      if (cur > 0) return [...acc, players[i]];
      return acc;
    }, [] as string[]);

    return {
      status: 'finished',
      moves: movesResponse,
      winners: winnersResponse,
    };
  }

  private draw(moves: Moves[]): number[] {
    const mask = moves.reduce((mask, move) => mask | move, 0);
    if (this.countSetBits(mask) !== 2) {
      return new Array(moves.length).fill(0);
    }

    const isRocks = mask & Moves.Rock;
    const isPapers = mask & Moves.Paper;
    const isScissors = mask & Moves.Scissors;

    const left = isRocks || isPapers || isScissors;
    const right = isScissors || isPapers || isRocks;
    const loser = ((left << 1) & ALL || Moves.Rock) & right || left;

    return moves.map((m) => +(m !== loser));
  }

  // recursive function to count set bits
  private countSetBits(n: number): number {
    // base case
    if (n == 0) return 0;

    // if last bit set add 1 else add 0
    return (n & 1) + this.countSetBits(n >> 1);
  }
}
