import { Column, DeepPartial, Entity, EntityManager, Index, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';

@Entity()
export class TwitterSession extends MetaEntity {
  @Index()
  @Column({ type: 'varchar' })
  state: string;

  @Column({ type: 'varchar' })
  codeVerifier: string;
}

@CustomRepository(TwitterSession)
export class TwitterSessionRepository extends Repository<TwitterSession> {
  createOrUpdateOne(entityLike: DeepPartial<TwitterSession>, entityManager?: EntityManager): Promise<TwitterSession> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
