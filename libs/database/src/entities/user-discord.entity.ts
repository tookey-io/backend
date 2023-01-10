import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, OneToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class UserDiscord extends MetaEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  discordId: string;

  @Column({ type: 'varchar', nullable: true })
  discordTag: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', nullable: true })
  locale: string | null;

  @Column({ type: 'boolean', nullable: true })
  verified: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  accessToken: string | null;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ nullable: true })
  validUntil: Date | null;
}

@CustomRepository(UserDiscord)
export class UserDiscordRepository extends Repository<UserDiscord> {
  createOrUpdateOne(entityLike: DeepPartial<UserDiscord>, entityManager?: EntityManager): Promise<UserDiscord> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
