import {
    Column,
    Entity, Index, Tree, TreeChildren, TreeLevelColumn, TreeParent, TreeRepository
} from 'typeorm';
import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';

@Entity()
@Tree("nested-set")
export class User extends MetaEntity {
    @Column({ unique: true })
    @Index({ unique: true })
    telegramUserId: number;

    @Column({ unique: true, nullable: true })
    @Index()
    telegramBaseChatId: number;

    @Column({ default: true })
    @Index()
    fresh: boolean;

    @Column({ default: new Date() })
    lastInteraction: Date;

    @TreeChildren()
    children: User[];

    @TreeParent()
    parent: User;

    get isFresh() { return this.fresh }

    get keys() { return [] }
}

@CustomRepository(User)
export class UserRepository extends TreeRepository<User> {
    foo() {
        return this.findOneBy({ id: 1 })
    }

    findRoot(): Promise<User> {
        return this.findRoots().then(col => col[0])
    }
}