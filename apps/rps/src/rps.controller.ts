import { Body, ClassSerializerInterceptor, Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RpsPlayerMoveDto, RpsStateRequestDto, RpsStateResponseDto } from './rps.dto';
import { RpsService } from './rps.service';

@Controller('rps')
@ApiTags('RPS')
@UseInterceptors(ClassSerializerInterceptor)
export class RpsController {
  constructor(private readonly rpsService: RpsService) {}

  @Post()
  playerMove(@Body() dto: RpsPlayerMoveDto): void {
    this.rpsService.playerMove(dto);
  }

  @Get()
  gameStatus(@Query() dto: RpsStateRequestDto): RpsStateResponseDto {
    return this.rpsService.getState(dto);
  }
}
