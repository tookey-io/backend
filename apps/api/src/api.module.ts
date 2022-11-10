import { Module } from '@nestjs/common';

import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { KeyModule } from './keys/keys.module';

@Module({
  imports: [KeyModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
