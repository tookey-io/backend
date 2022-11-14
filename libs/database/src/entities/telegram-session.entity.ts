import {
  Column,
  DeepPartial,
  Entity,
  EntityManager,
  PrimaryColumn,
  Repository,
} from 'typeorm';

import { CustomRepository } from '../typeorm-ex.decorator';

interface SceneSessionData {
  current?: string;
  expires?: number;
  state?: object;
}

interface SceneSession<S extends SceneSessionData = SceneSessionData> {
  __scenes: S;
}

@Entity()
export class TelegramSession {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'jsonb', default: { __scenes: {} } })
  session: SceneSession<SceneSessionData>;
}

@CustomRepository(TelegramSession)
export class TelegramSessionRepository extends Repository<TelegramSession> {
  createOrUpdateOne(
    entityLike: DeepPartial<TelegramSession>,
    entityManager?: EntityManager,
  ): Promise<TelegramSession> {
    const entity = this.create(entityLike);
    return entityManager ? entityManager.save(entity) : this.save(entity);
  }
}
