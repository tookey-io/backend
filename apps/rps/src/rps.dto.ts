export enum Moves {
  Rock = 1, // 001
  Scissors = 2, // 010
  Paper = 4, // 100
}

export enum RpsStatus {
  Wait = 'wait',
  Start = 'start',
  Commit = 'commit',
  Reveal = 'reveal',
  Finished = 'finished',
  Fail = 'fail',
}

export class RpsRoomDataDto {
  [player: string]: RpsPlayerDataDto;
}

export class RpsPlayerDataDto {
  playerId: string;
  commitment?: string;
  choice?: Moves;
  nonce?: string;
}

export class RpsPlayerJoinDto {
  roomId: string;
  playerId: string;
}

export class RpsPlayerLeaveDto {
  roomId: string;
  playerId: string;
}

export class RpsPlayerCommitDto {
  roomId: string;
  playerId: string;
  commitment: string;
}

export class RpsPlayerRevealDto {
  roomId: string;
  playerId: string;
  choice: Moves;
  nonce: string;
}

export class RpsGameState {
  status?: RpsStatus;
  roomId?: string;
  players?: RpsRoomDataDto;
  winners?: string[];
}
