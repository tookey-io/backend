import { Matches } from 'class-validator';
import { Column, DeepPartial, Entity, EntityManager, Index, JoinColumn, OneToOne, Repository } from 'typeorm';

import { BadRequestException } from '@nestjs/common';

import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class AofgProfile extends MetaEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Index({ unique: true })
  @Column({ unique: true, nullable: false })
  userId: number;

  @Column({ length: 20, type: 'varchar', nullable: true })
  @Matches(/[A-Za-z0-9\ ]{3,20}/)
  name?: string;

  @Column({ length: 40, type: 'char', nullable: true })
  @Matches(/[a-f0-9]{40}/)
  multisigAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  title?: string;
}

@CustomRepository(AofgProfile)
export class AofgProfileRepository extends Repository<AofgProfile> {
  async createOrUpdateOne(entityLike: DeepPartial<AofgProfile>, entityManager?: EntityManager) {
    const userId = entityLike.userId;
    if (typeof userId === 'undefined') {
      throw new BadRequestException('userId is required to create or update entity');
    }

    let entity = await (entityManager ? entityManager.findOneBy(AofgProfile, { userId }) : this.findOneBy({ userId }));
    if (!entity) {
      entity = this.create(entityLike);
    }

    entity.name = entityLike.name || entity.name;
    entity.multisigAddress = entityLike.multisigAddress || entity.multisigAddress;
    entity.title = entityLike.title || entity.title;

    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
