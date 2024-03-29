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
  OneToMany,
  Repository,
} from 'typeorm';

import { TaskStatus } from '../database.types';
import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { KeyParticipant } from './key-participant.entity';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';

@Entity()
export class Key extends MetaEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index()
  @Column({ type: 'varchar' })
  roomId: string;

  @Column({ type: 'int', unsigned: true, default: 3 })
  participantsCount: number;

  @Column({ type: 'int', unsigned: true, default: 2 })
  participantsThreshold: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  participantIndex: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  timeoutSeconds: number | null;

  @Index()
  @Column({ type: 'varchar', length: 66, nullable: true })
  publicKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true, array: true })
  tags: string[] | null;

  @OneToMany(() => KeyParticipant, (participant) => participant.key)
  participants: KeyParticipant[];

  @Index()
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Created })
  status: TaskStatus;

  @Column({ type: 'int', unsigned: true, array: true, default: [] })
  participantsActive: number[];

  @Column({ type: 'varchar', nullable: true })
  verificationHook: string | null;

  @ManyToMany(() => UserDevice, (device) => device.keys)
  devices: UserDevice[];

  constructor(partial: Partial<Key>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(Key)
export class KeyRepository extends Repository<Key> {
  createOrUpdateOne(entityLike: DeepPartial<Key>, entityManager?: EntityManager): Promise<Key> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
