import { Job } from 'bull';

import { Process, Processor } from '@nestjs/bull';

import { RPS_QUEUE } from './rps.constants';
import { RpsPlayerCommitDto, RpsPlayerRevealDto } from './rps.dto';
import { RpsService } from './rps.service';

@Processor(RPS_QUEUE)
export class RpsProcessor {
  constructor(private readonly rpsService: RpsService) {}

  @Process('commit')
  handlePlayerCommit(job: Job<RpsPlayerCommitDto>): void {
    this.rpsService.commit(job.data, true);
  }

  @Process('reveal')
  handlePlayerReveal(job: Job<RpsPlayerRevealDto>): void {
    this.rpsService.reveal(job.data, true);
  }
}
