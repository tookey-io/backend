import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, ManyToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { PermissionToken } from './permission-token.entity';
import { User } from './user.entity';

@Entity()
export class UserPermissionToken extends MetaEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @ManyToOne(() => PermissionToken)
  @JoinColumn()
  permissionToken: PermissionToken;

  @Index()
  @Column()
  permissionTokenId: number;

  constructor(partial: Partial<UserPermissionToken>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(UserPermissionToken)
export class UserPermissionTokenRepository extends Repository<UserPermissionToken> {
  createOrUpdateOne(
    entityLike: DeepPartial<UserPermissionToken>,
    entityManager?: EntityManager,
  ): Promise<UserPermissionToken> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
