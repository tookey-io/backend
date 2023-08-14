import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Repository
} from 'typeorm';

import { UserDeviceType } from '../database.types';
import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { Key } from './key.entity';
import { User } from './user.entity';

@Entity()
export class UserDevice extends MetaEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Index({ unique: true })
  @Column({ unique: true })
  token: string;

  @ManyToMany(() => Key, (key) => key.devices)
  @JoinTable()
  keys: Key[];

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Index()
  @Column({ type: 'enum', enum: UserDeviceType, default: UserDeviceType.FirebaseMessaging })
  deviceType: UserDeviceType;

  constructor(partial: Partial<UserDevice>) {
    super();
    Object.assign(this, partial);
  }
}

@CustomRepository(UserDevice)
export class UserDeviceRepository extends Repository<UserDevice> {
  findDevicesByUser(user: User): Promise<UserDevice[]> {
    return this.find({ relations: { user: true, keys: true }, where: { user: { id: user.id } } });
  }

  async createOrUpdateOne(entityLike: DeepPartial<UserDevice> & Pick<UserDevice, "token">, entityManager?: EntityManager): Promise<UserDevice> {
    let entity = await this.findOneBy({ token: entityLike.token });
    if (entity == null) {
      entity = this.create(entityLike);
    }
    
    Object.assign(entity, entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
