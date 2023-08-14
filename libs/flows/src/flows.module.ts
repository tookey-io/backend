import { Module } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { HttpModule } from '@nestjs/axios';

@Module({
imports: [HttpModule],
  providers: [FlowsService],
  exports: [FlowsService],
})
export class FlowsModule {}
