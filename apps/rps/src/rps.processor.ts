import { Job } from 'bull';

import { Process, Processor } from '@nestjs/bull';

import { RPS_QUEUE } from './rps.constants';
import { RpsMoveUpdateDto } from './rps.dto';
import { RpsService } from './rps.service';

@Processor(RPS_QUEUE)
export class RpsProcessor {
  constructor(private readonly rpsService: RpsService) {}

  @Process('player-move')
  handlePlayerMove(job: Job<RpsMoveUpdateDto>): void {
    this.rpsService.updateState(job.data);
  }
}
