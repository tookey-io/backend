import { Exclude } from 'class-transformer';
import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, OneToOne, Repository } from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class UserTelegram extends MetaEntity {
  @OneToOne(() => User, user => user.telegram)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  @Exclude({ toPlainOnly: true })
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Index()
  @Column({ type: 'bigint', unique: true, nullable: true })
  chatId: number | null;

  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  username: string | null;

  @Column({ type: 'varchar', nullable: true })
  languageCode: string | null;
}

@CustomRepository(UserTelegram)
export class UserTelegramRepository extends Repository<UserTelegram> {
  createOrUpdateOne(entityLike: DeepPartial<UserTelegram>, entityManager?: EntityManager): Promise<UserTelegram> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
