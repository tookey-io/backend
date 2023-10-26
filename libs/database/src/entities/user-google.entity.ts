import { Exclude } from 'class-transformer';
import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, OneToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class UserGoogle extends MetaEntity {
  @OneToOne(() => User, user => user.google)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  @Exclude({ toPlainOnly: true })
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  googleId: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  accessToken: string | null;
}

@CustomRepository(UserGoogle)
export class UserGoogleRepository extends Repository<UserGoogle> {
  createOrUpdateOne(entityLike: DeepPartial<UserGoogle>, entityManager?: EntityManager): Promise<UserGoogle> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
