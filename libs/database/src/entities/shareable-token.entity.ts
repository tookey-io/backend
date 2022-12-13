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
export class ShareableToken extends MetaEntity {
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

  constructor(partial: Partial<ShareableToken>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(ShareableToken)
export class ShareableTokenRepository extends Repository<ShareableToken> {
  createOrUpdateOne(entityLike: DeepPartial<ShareableToken>, entityManager?: EntityManager): Promise<ShareableToken> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
