import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';
import { DatabaseConfig } from './database.types';
import { AccessToken } from './entities/token.entity';
import { User } from './entities/user.entity';

@Injectable()
export class DatabaseService implements TypeOrmOptionsFactory {
    constructor(private config: ConfigService<DatabaseConfig>) { }

    createTypeOrmOptions(
        _connectionName?: string,
    ): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
        const db = this.config.get('db', { infer: true });

        console.log('entities path: ', join(__dirname, '**/entities/**.entity.{ts,js}'))
        return {
            type: 'postgres',
            ...db,
            entities: [
                User,
                AccessToken
            ],
            synchronize: true,
            retryAttempts: 50,
            retryDelay: 100,
            migrations: [],
            migrationsTableName: 'typeorm_migrations',
            migrationsRun: true,
        };
    }
}
