import { Queue } from 'bull';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';

import { ALL, Moves, RPS_QUEUE } from './rps.constants';
import { RpsPlayerMoveDto, RpsRoomState, RpsStateRequestDto, RpsStateResponseDto } from './rps.dto';

@Injectable()
export class RpsService {
  state = new Map<string, RpsRoomState>();

  constructor(
    @InjectPinoLogger(RpsService.name) private readonly logger: PinoLogger,
    @InjectQueue(RPS_QUEUE) private readonly rpsQueue: Queue<RpsPlayerMoveDto>,
  ) {}

  playerMove(move: RpsPlayerMoveDto): void {
    const jobId = `${move.roomId}:${move.playerId}`;
    this.rpsQueue.add('player-move', move, { jobId });
  }

  updateState(state: RpsPlayerMoveDto): string {
    this.logger.info(this.state);
    const { roomId, ...roomState } = state;
    if (!this.state.has(roomId)) this.state.set(roomId, { [roomState.playerId]: roomState.hash });
    else this.state.set(roomId, { ...this.state.get(roomId), [roomState.playerId]: roomState.hash });
    return '';
  }

  getState(dto: RpsStateRequestDto): RpsStateResponseDto {
    if (!this.state.has(dto.roomId)) {
      throw new BadRequestException('');
    }
    const roomState = this.state.get(dto.roomId);
    const players = Object.keys(roomState);
    if (players.length < 2) return { status: 'created' };

    const moveHashes = Object.values(roomState);
    const moves = moveHashes.map(this.hashToMove);

    const winners = this.draw(moves);

    const movesResponse = moves.reduce((acc, cur, i) => {
      return { ...acc, [players[i]]: cur };
    }, {});

    const winnersResponse = winners.reduce((acc, cur, i) => {
      if (cur > 0) return [...acc, players[i]];
      return acc;
    }, []);

    return {
      status: 'finished',
      moves: movesResponse,
      winners: winnersResponse,
    };
  }

  private hashToMove(hash: string): number {
    return parseInt(hash);
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
