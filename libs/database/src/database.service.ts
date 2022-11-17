import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { DatabaseConfig } from './database.types';
import * as entities from './entities';
import * as migrations from './migrations';

@Injectable()
export class DatabaseService implements TypeOrmOptionsFactory {
  constructor(private config: ConfigService<DatabaseConfig>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    const db = this.config.get('db', { infer: true });

    return {
      type: 'postgres',
      ...db,
      ssl: db.ssl ? { rejectUnauthorized: false } : false,
      entities,
      migrations,
      synchronize: false,
      migrationsTableName: 'migrations',
      migrationsRun: true,
    };
  }
}
