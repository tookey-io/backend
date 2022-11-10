import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  ManyToOne,
  Repository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';
import { User } from './user.entity';

@Entity()
export class KeyParticipant extends MetaEntity {
  @ManyToOne(() => Key, (key) => key.participants)
  key: Key;

  @Column()
  keyId: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'int', unsigned: true })
  index: number;

  constructor(partial: Partial<KeyParticipant>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(KeyParticipant)
export class KeyParticipantRepository extends Repository<KeyParticipant> {
  createOrUpdateOne(
    entityLike: DeepPartial<KeyParticipant>,
    entityManager?: EntityManager,
  ): Promise<KeyParticipant> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
