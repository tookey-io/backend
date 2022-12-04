import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Repository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity()
export class PermissionToken extends MetaEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @ManyToMany(() => Key)
  @JoinTable()
  keys: Key[];

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];

  @Column({ nullable: true })
  validUntil: Date | null;

  constructor(partial: Partial<PermissionToken>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(PermissionToken)
export class PermissionTokenRepository extends Repository<PermissionToken> {
  createOrUpdateOne(entityLike: DeepPartial<PermissionToken>, entityManager?: EntityManager): Promise<PermissionToken> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
