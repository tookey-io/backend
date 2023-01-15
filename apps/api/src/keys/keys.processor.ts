import { Job } from 'bull';

import { Process, Processor } from '@nestjs/bull';

import { KeyEvent } from '../api.events';
import { KEYS_QUEUE } from './keys.constants';
import { KeyCreateFinishedDto } from './keys.dto';
import { KeysService } from './keys.service';

@Processor(KEYS_QUEUE)
export class KeysProcessor {
  constructor(private readonly keysService: KeysService) {}

  @Process(KeyEvent.CREATE_FINISHED)
  handlePlayerCommit(job: Job<KeyCreateFinishedDto>): void {
    this.keysService.createFinished(job.data);
  }
}
