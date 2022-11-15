import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  Index,
  JoinColumn,
  OneToOne,
  Repository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class UserTelegram extends MetaEntity {
  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'bigint', unique: true })
  @Index({ unique: true })
  telegramId: number;

  @Column({ type: 'bigint', unique: true, nullable: true })
  @Index()
  chatId: number;
}

@CustomRepository(UserTelegram)
export class UserTelegramRepository extends Repository<UserTelegram> {
  createOrUpdateOne(
    entityLike: DeepPartial<UserTelegram>,
    entityManager?: EntityManager,
  ): Promise<UserTelegram> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
