import { Queue } from 'bull';
import * as crypto from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';

import { ALL, RPS_QUEUE } from './rps.constants';
import { Moves, RpsPlayerCommitDto, RpsPlayerRevealDto, RpsRoomDataDto } from './rps.dto';

@Injectable()
export class RpsService {
  games = new Map<string, RpsRoomDataDto>();

  constructor(
    @InjectPinoLogger(RpsService.name) private readonly logger: PinoLogger,
    @InjectQueue(RPS_QUEUE) private readonly rpsQueue: Queue<RpsPlayerRevealDto | RpsPlayerCommitDto>,
  ) {}

  syncNodes(name: 'commit' | 'reveal', dto: RpsPlayerRevealDto | RpsPlayerCommitDto): void {
    this.rpsQueue.add(name, dto);
  }

  async syncInProgress(): Promise<boolean> {
    this.logger.info('sync started');
    return new Promise((resolve) => {
      // TODO(temadev): sync aknowledge
      setTimeout(() => {
        resolve(true);
        this.logger.info('sync resolved');
      }, 500);
    });
  }

  join(roomId: string, playerId: string): RpsRoomDataDto {
    if (!this.games.has(roomId)) {
      this.games.set(roomId, { [`${playerId}`]: { playerId } });
    } else {
      const room = this.games.get(roomId);
      this.games.set(roomId, { ...room, [`${playerId}`]: { playerId } });
    }
    return this.games.get(roomId);
  }

  leave(roomId: string, playerId: string): RpsRoomDataDto {
    if (!this.games.has(roomId)) return null;
    const room = this.games.get(roomId);
    if (room[playerId]) {
      delete room[playerId];
      this.games.set(roomId, room);
      return this.games.get(roomId);
    }
    return room;
  }

  commit(dto: RpsPlayerCommitDto, sync?: boolean): RpsRoomDataDto {
    this.logger.info(sync);
    if (!sync) this.syncNodes('commit', dto);
    const { roomId, playerId, commitment } = dto;
    if (!this.games.has(roomId)) return;
    const room = this.games.get(roomId);
    const players = Object.values(room);
    const player = players.find((p) => p.playerId === playerId);
    if (!player) return;
    this.games.set(roomId, { ...room, [playerId]: { playerId, commitment } });
    return this.games.get(roomId);
  }

  isAllPlayersCommitted(roomId: string): boolean {
    if (!this.games.has(roomId)) return;
    const room = this.games.get(roomId);
    return Object.values(room).every((player) => player.commitment);
  }

  reveal(dto: RpsPlayerRevealDto, sync?: boolean): RpsRoomDataDto {
    this.logger.info(sync);
    if (!sync) this.syncNodes('reveal', dto);
    const { roomId, playerId, choice, nonce } = dto;
    if (!this.games.has(roomId)) return;
    const room = this.games.get(roomId);
    const players = Object.values(room);
    const player = players.find((p) => p.playerId === playerId);
    if (!player) return;

    this.games.set(roomId, { ...room, [playerId]: { ...player, choice, nonce } });
    return this.games.get(roomId);
  }

  isAllPlayersRevealed(roomId: string): boolean {
    if (!this.games.has(roomId)) return;
    const room = this.games.get(roomId);
    return Object.values(room).every((player) => {
      return this.hash(player.choice, player.nonce) === player.commitment;
    });
  }

  getWinners(roomId: string): string[] | null {
    if (!this.games.has(roomId)) throw new BadRequestException('');
    const room = this.games.get(roomId);
    const players = Object.keys(room);
    const playersData = Object.values(room);

    const winnersIndexes = this.draw(playersData.map((data) => data.choice));

    return winnersIndexes.reduce((acc, cur, i) => {
      if (cur > 0) return [...acc, players[i]];
      return acc;
    }, [] as string[]);
  }

  archiveRoom(roomId: string): void {
    if (!this.games.has(roomId)) return;
    const room = this.games.get(roomId);
    this.games.set(roomId + Date.now(), room);
    this.games.delete(roomId);
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

  private hash(message: string | number, randomValue: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(randomValue + message);
    return hash.digest('hex');
  }
}
