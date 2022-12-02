import { Column, DeepPartial, Entity, EntityManager, Index, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';

@Entity()
export class Permission extends MetaEntity {
  @Index()
  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  constructor(partial: Partial<Permission>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(Permission)
export class PermissionRepository extends Repository<Permission> {
  createOrUpdateOne(entityLike: DeepPartial<Permission>, entityManager?: EntityManager): Promise<Permission> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
