import { Column, DeepPartial, Entity, EntityManager, Index, ManyToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';
import { User } from './user.entity';

@Entity()
export class KeyParticipant extends MetaEntity {
  @ManyToOne(() => Key, (key) => key.participants, { onDelete: 'CASCADE' })
  key: Key;

  @Index()
  @Column()
  keyId: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Index()
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
  createOrUpdateOne(entityLike: DeepPartial<KeyParticipant>, entityManager?: EntityManager): Promise<KeyParticipant> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
