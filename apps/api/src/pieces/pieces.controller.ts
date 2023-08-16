import { Body, ClassSerializerInterceptor, Controller, Get, NotFoundException, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { PiecesService } from './pieces.service';
import { Piece } from '@tookey/database';
import { PieceDto } from './pieces.dto';
import { AnyRoles } from '../decorators/any-role.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';

@Controller('/api')
@UseInterceptors(ClassSerializerInterceptor)
export class PiecesController {
  constructor(private readonly piecesService: PiecesService) {}

  @Get('/pieces')
  async getAllPieces(@Query("release") release?: string) {
    return this.piecesService.getAllPieces(release);
  }

  @Get('/pieces/:name')
  async findPiece(@Param("name") name: string, @Query("version") version?: string) {
    const piece = await this.piecesService.getPiece(name, version);
    if (!piece) {
        throw new NotFoundException(`Piece ${name}${version ? `:${version}` : ''} not found`);
    }
    return piece
  }
  @Get('/pieces/:vendor/:piece')
  async findPieceByVendorAndScope(@Param("vendor") vendor: string, @Param("piece") pieceName: string, @Query("version") version?: string) {
    const piece = await this.piecesService.getPiece(`${vendor}/${pieceName}`, version);
    if (!piece) {
        throw new NotFoundException(`Piece ${vendor}/${pieceName}${version ? `:${version}` : ''} not found`);
    }
    return piece
  }

  @AnyRoles('admin.pieces.write')
  @JwtAuth()
  @Post('/admin/pieces')
  async createPiece(@Body() dto: PieceDto) {
    delete dto.id;
    return this.piecesService.createPiece(dto);
  }
}
