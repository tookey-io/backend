import { Column, DeepPartial, Entity, EntityManager, Index, ManyToOne, Repository } from 'typeorm';

import { TaskStatus } from '../database.types';
import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';

@Entity()
export class Sign extends MetaEntity {
  @ManyToOne(() => Key)
  key: Key;

  @Index()
  @Column()
  keyId: number;

  @Index()
  @Column({ type: 'varchar' })
  roomId: string;

  @Column({ type: 'int', unsigned: true, array: true })
  participantsConfirmations: number[];

  @Column({ type: 'timestamptz' })
  timeoutAt: Date;

  @Column({ type: 'varchar' })
  data: string;

  @Column({ type: 'jsonb' })
  metadata: Record<string, any>;

  @Index()
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Created })
  status: TaskStatus;

  @Column({ type: 'varchar', nullable: true })
  result: string | null;

  constructor(partial: Partial<Sign>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(Sign)
export class SignRepository extends Repository<Sign> {
  createOrUpdateOne(entityLike: DeepPartial<Sign>, entityManager?: EntityManager): Promise<Sign> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
