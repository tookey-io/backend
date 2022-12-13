import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, OneToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class UserTwitter extends MetaEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  twitterId: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar', nullable: true })
  accessToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ nullable: true })
  validUntil: Date | null;
}

@CustomRepository(UserTwitter)
export class UserTwitterRepository extends Repository<UserTwitter> {
  createOrUpdateOne(entityLike: DeepPartial<UserTwitter>, entityManager?: EntityManager): Promise<UserTwitter> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
