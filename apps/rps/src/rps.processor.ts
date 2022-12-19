import { Job } from 'bull';

import { Process, Processor } from '@nestjs/bull';

import { RPS_QUEUE } from './rps.constants';
import { RpsPlayerMoveDto } from './rps.dto';
import { RpsService } from './rps.service';

@Processor(RPS_QUEUE)
export class RpsProcessor {
  constructor(private readonly rpsService: RpsService) {}

  @Process('player-move')
  handlePlayerMove(job: Job<RpsPlayerMoveDto>): void {
    this.rpsService.updateState(job.data);
  }
}
