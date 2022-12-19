import { IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

type RpsGameStatus = 'created' | 'finished';

export class RpsStateResponseDto {
  @ApiProperty()
  @IsString()
  status: RpsGameStatus;

  @ApiPropertyOptional()
  @IsString({ each: true })
  winners?: PlayerId[];

  @ApiPropertyOptional()
  moves?: {
    [playerId: PlayerId]: string;
  };
}
