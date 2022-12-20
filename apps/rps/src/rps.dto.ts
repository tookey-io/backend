import { IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Moves {
  Rock = 1, // 001
  Scissors = 2, // 010
  Paper = 4, // 100
}

export type PlayerId = string;
export type RoomId = string;

export class RpsPlayerMoveDto {
  @ApiProperty()
  @IsString()
  roomId: RoomId;

  @ApiProperty()
  @IsString()
  playerId: PlayerId;

  @ApiProperty()
  @IsString()
  hash: string;
}

export class RpsRoomState {
  [playerId: PlayerId]: string;
}

export class RpsStateRequestDto {
  @ApiProperty()
  @IsString()
  roomId: RoomId;

  @ApiProperty()
  @IsString()
  playerId: PlayerId;
}

type RpsGameStatus = 'started' | 'finished';

export class RpsStateResponseDto {
  @ApiProperty()
  @IsString()
  status: RpsGameStatus;

  @ApiPropertyOptional()
  @IsString({ each: true })
  winners?: PlayerId[];

  @ApiPropertyOptional()
  moves?: {
    [playerId: PlayerId]: number;
  };
}

export class RpsRoomDto {
  [address: string]: number;
}

export class RpsRoomUpdateDto {
  @IsString()
  roomId: string;

  @IsString()
  address: string;
}

export class RpsMoveUpdateDto extends RpsRoomUpdateDto {
  move: Moves;
}
