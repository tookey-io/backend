export const RPS_QUEUE = 'rps';

export enum Moves {
  Rock = 1, // 001
  Scissors = 2, // 010
  Paper = 4, // 100
}

export const ALL = Moves.Rock | Moves.Scissors | Moves.Paper;
