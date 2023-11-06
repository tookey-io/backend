import { Exclude, Expose } from "class-transformer";
import { Column, DeepPartial, Entity, EntityManager, Index, Repository, Unique } from "typeorm";
import { CustomRepository } from "../typeorm-ex.decorator";
import { MetaEntity } from "./base";

@Entity()
@Index('idx_piece_name_client_id', ['pieceName', 'clientId'], { unique: true })
@Unique('unique_piece_name_client_id', ['pieceName', 'clientId'])
export class SecretEntity extends MetaEntity {
    @Index()
    @Column({ nullable: false })
    pieceName: string;

    @Column({ nullable: false })
    @Expose({ groups: ['superadmin'] })
    clientSecret: string;

    @Index()
    @Column({ nullable: false })
    clientId: string;
    
}

@CustomRepository(SecretEntity)
export class SecretsRepository extends Repository<SecretEntity> {
  createOrUpdateOne(entityLike: DeepPartial<SecretEntity>, entityManager?: EntityManager): Promise<SecretEntity> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
  
  findOneByPieceName(pieceName: string): Promise<SecretEntity> {
    return this.findOneBy({ pieceName });
  }
}