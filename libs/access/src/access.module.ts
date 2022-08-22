import { Module } from '@nestjs/common';
import { AccessTokenRepository } from '@tookey/database/entities/token.entity';
import { TypeOrmExModule } from '@tookey/database/typeorm-ex-module';
import { AccessService } from './access.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([AccessTokenRepository])
  ],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule { }
