import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, ManyToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class Wallet extends MetaEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Column({ type: 'varchar' })
  salt: string;

  @Column({ type: 'varchar' })
  iv: string;

  @Column({ type: 'varchar' })
  encryptedData: string;

  @Column({ type: 'varchar' })
  tag: string;

  @Index()
  @Column({ type: 'varchar' })
  address: string;
}

@CustomRepository(Wallet)
export class WalletRepository extends Repository<Wallet> {
  createOrUpdateOne(entityLike: DeepPartial<Wallet>, entityManager?: EntityManager): Promise<Wallet> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
