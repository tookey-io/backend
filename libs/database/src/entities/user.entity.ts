import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  Generated,
  Index,
  OneToMany,
  OneToOne,
  Tree,
  TreeChildren,
  TreeParent,
  TreeRepository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';
import { UserDiscord } from './user-discord.entity';
import { UserEmail } from './user-email.entity';
import { UserGoogle } from './user-google.entity';
import { UserRole } from './user-role.type';
import { UserTelegram } from './user-telegram.entity';
import { UserTwitter } from './user-twitter.entity';

@Entity()
@Tree('nested-set')
export class User extends MetaEntity {
  @Index()
  @Column({ nullable: true })
  @Generated('uuid')
  uuid?: string | null;

  @Index()
  @Column({ default: true })
  fresh: boolean;

  @Column({ default: () => 'now()' })
  lastInteraction: Date;

  @TreeChildren()
  children: User[];

  @TreeParent()
  parent: User;

  @Column({ type: 'int', unsigned: true, default: 2 })
  keyLimit: number;

  @OneToMany(() => Key, (key) => key.id)
  keys: Key[];

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @OneToOne(type => UserEmail, email => email.user, { eager: true })
  @Exclude({ toPlainOnly: true })
  email?: UserEmail

  @OneToOne(type => UserGoogle, google => google.user, { eager: true })
  google?: UserGoogle

  @OneToOne(type => UserDiscord, discord => discord.user, { eager: true })
  discord?: UserDiscord

  @OneToOne(type => UserTelegram, telegram => telegram.user, { eager: true })
  telegram?: UserTelegram

  @OneToOne(type => UserTwitter, twitter => twitter.user, { eager: true })
  twitter?: UserTwitter
  
  @Expose({ toPlainOnly: true})
  get firstName() {
    return this.email?.firstName || this.google?.firstName || this.telegram?.firstName || this.twitter?.username || this.discord?.discordTag
  }
  
  @Expose({ toPlainOnly: true})
  get lastName() {
    return this.email?.lastName || this.google?.lastName || this.telegram?.lastName || this.twitter?.username || this.discord?.discordTag
  }
  
  @Expose({ toPlainOnly: true})
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

@CustomRepository(User)
export class UserRepository extends TreeRepository<User> {
  async findRoot(): Promise<User> {
    const users = await this.findRoots();
    return users[0];
  }

  createOrUpdateOne(entityLike: DeepPartial<User>, entityManager?: EntityManager): Promise<User> {
    const entity = this.create(entityLike);
    console.log(entity);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
