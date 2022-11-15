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
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Index()
  @Column()
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Index()
  @Column({ type: 'bigint', unique: true, nullable: true })
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
