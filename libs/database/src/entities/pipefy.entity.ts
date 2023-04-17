import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, ManyToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class Pipefy extends MetaEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index()
  @Column({ type: 'int' })
  pipeId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  cardId: string;
}

@CustomRepository(Pipefy)
export class PipefyRepository extends Repository<Pipefy> {
  createOrUpdateOne(entityLike: DeepPartial<Pipefy>, entityManager?: EntityManager): Promise<Pipefy> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
