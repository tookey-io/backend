import { Column, DeepPartial, Entity, EntityManager, Index, Repository, Unique } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';

@Index('idx_piece_name_version', ['name', 'version'], { unique: true })
@Unique('unique_piece_name_version', ['name', 'version'])
@Entity()
export class Piece extends MetaEntity {
  @Column({ type: String, nullable: false })
  name: string;

  @Column({ type: String, nullable: false })
  displayName: string;

  @Column({ type: String, nullable: false })
  logoUrl: string;

  @Column({ type: String, nullable: true })
  description?: string;

  @Column({ type: String, nullable: true })
  projectId?: string;

  @Column({ type: String, nullable: false, collation: 'LOCALE = \'en-US-u-kn-true\', PROVIDER = \'icu\''})
  version: string;

  @Column({ type: String, nullable: false })
  minimumSupportedRelease: string;

  @Column({ type: String, nullable: false })
  maximumSupportedRelease: string;

  @Column({ type: 'jsonb', nullable: true })
  auth?: Object;

  @Column({ type: 'jsonb', nullable: false })
  actions: Object;

  @Column({ type: 'jsonb', nullable: false })
  triggers: Object;

  @Column({ type: 'enum', enum: ['OFFICIAL', 'COMMUNITY'], nullable: false, default: "OFFICIAL" })
  pieceType: 'OFFICIAL' | 'COMMUNITY';

  @Column({ type: 'enum', enum: ['REGISTRY', 'LOCAL'], nullable: false, default: "REGISTRY" })
  packageType: 'REGISTRY' | 'LOCAL';
}

@CustomRepository(Piece)
export class PieceRepository extends Repository<Piece> {
  createOrUpdateOne(entityLike: DeepPartial<Piece>, entityManager?: EntityManager): Promise<Piece> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
