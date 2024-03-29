import { Exclude } from 'class-transformer';
import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, OneToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class UserTwitter extends MetaEntity {
  @OneToOne(() => User, user => user.twitter)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  @Exclude({ toPlainOnly: true })
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  twitterId: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude({ toPlainOnly: true })
  accessToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude({ toPlainOnly: true })
  refreshToken: string | null;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  validUntil: Date | null;
}

@CustomRepository(UserTwitter)
export class UserTwitterRepository extends Repository<UserTwitter> {
  createOrUpdateOne(entityLike: DeepPartial<UserTwitter>, entityManager?: EntityManager): Promise<UserTwitter> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
