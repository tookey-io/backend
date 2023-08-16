import { Module } from '@nestjs/common';
import { PiecesService } from './pieces.service';
import { PiecesController } from './pieces.controller';
import { PieceRepository, TypeOrmExModule } from '@tookey/database';
import { EventEmitterModule } from '@nestjs/event-emitter';

const PiecesRepositories = TypeOrmExModule.forCustomRepository([PieceRepository]);

@Module({
  imports: [
    PiecesRepositories,
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  providers: [PiecesService],
  controllers: [PiecesController]
})
export class PiecesModule {}
