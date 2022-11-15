import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  Index,
  ManyToOne,
  Repository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class AccessToken extends MetaEntity {
  @ManyToOne(() => User)
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @Column()
  validUntil: Date;
}

@CustomRepository(AccessToken)
export class AccessTokenRepository extends Repository<AccessToken> {
  createOrUpdateOne(
    entityLike: DeepPartial<AccessToken>,
    entityManager?: EntityManager,
  ): Promise<AccessToken> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
