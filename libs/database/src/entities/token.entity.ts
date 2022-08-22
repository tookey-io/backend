import {
    Column,
    Entity, Index, JoinColumn, OneToOne, Repository
} from 'typeorm';
import { CustomRepository } from '../typeorm-ex.decorator';
import { MetaEntity } from './base';
import { User } from './user.entity';

@Entity()
export class AccessToken extends MetaEntity {
    @OneToOne(() => User)
    @JoinColumn()
    user: User

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 64, unique: true })
    token: string

    @Column()
    validUntil: Date
}

@CustomRepository(AccessToken)
export class AccessTokenRepository extends Repository<AccessToken> {
    getByUserId(id: User['id']) {
        return this.createQueryBuilder().relation(AccessToken, "user").of(id).loadOne() as Promise<AccessToken | null>
    }
}