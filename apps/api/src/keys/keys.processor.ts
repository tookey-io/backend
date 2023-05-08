import { Job } from 'bull';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { OnGlobalQueueCompleted, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { KeyEvent } from '../api.events';
import { KEYS_QUEUE } from './keys.constants';
import { KeyCreateFinishedDto } from './keys.dto';
import { KeysService } from './keys.service';

@Processor(KEYS_QUEUE)
export class KeysProcessor {
  constructor(
    @InjectPinoLogger(KeysService.name) private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process(KeyEvent.CREATE_FINISHED)
  handleKeyCreate(job: Job<KeyCreateFinishedDto>): void {
    this.logger.info(`Key Create Process: ${job.data.publicKey}`);
    this.eventEmitter.emit(KeyEvent.CREATE_FINISHED, job.data.publicKey, job.data.userId);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.info(`Processing job ${job.id} of type ${job.name} with data ${job.data}...`);
  }

  @OnGlobalQueueCompleted()
  async onGlobalCompleted(jobId: number, result: any) {
    this.logger.info('(Global) on completed: job ', jobId, ' -> result: ', result);
  }
}
