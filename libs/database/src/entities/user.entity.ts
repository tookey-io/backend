import { Exclude } from 'class-transformer';
import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  Index,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
  TreeRepository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';

@Entity()
@Tree('nested-set')
export class User extends MetaEntity {
  @Index()
  @Column({ default: true })
  fresh: boolean;

  @Column({ default: () => 'now()' })
  lastInteraction: Date;

  @TreeChildren()
  children: User[];

  @TreeParent()
  parent: User;

  @Column({ type: 'int', unsigned: true, default: 2 })
  keyLimit: number;

  @OneToMany(() => Key, (key) => key.id)
  keys: Key[];

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string | null;
}

@CustomRepository(User)
export class UserRepository extends TreeRepository<User> {
  async findRoot(): Promise<User> {
    const users = await this.findRoots();
    return users[0];
  }

  createOrUpdateOne(entityLike: DeepPartial<User>, entityManager?: EntityManager): Promise<User> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
