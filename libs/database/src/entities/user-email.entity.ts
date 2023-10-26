import { Exclude } from 'class-transformer';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
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
import bcrypt from 'bcrypt';

@Entity()
export class UserEmail extends MetaEntity {
  @OneToOne(() => User, user => user.email)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  @Exclude({ toPlainOnly: true })
  userId: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Index()
  @Column({ type: 'varchar', nullable: false })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Exclude({ toPlainOnly: true })
  public previousPassword: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password && this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'bool', nullable: false, default: false })
  verified: boolean;

  @Column({ type: String, nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  hash?: string;
}

@CustomRepository(UserEmail)
export class UserEmailRepository extends Repository<UserEmail> {
  createOrUpdateOne(entityLike: DeepPartial<UserEmail>, entityManager?: EntityManager): Promise<UserEmail> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
