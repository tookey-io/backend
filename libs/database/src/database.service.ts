import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { DatabaseConfig } from './database.types';
import * as entities from './entities';

@Injectable()
export class DatabaseService implements TypeOrmOptionsFactory {
  constructor(private config: ConfigService<DatabaseConfig>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    const db = this.config.get('db', { infer: true });

    return {
      type: 'postgres',
      ...db,
      entities,
      synchronize: true,
      migrations: [],
      migrationsTableName: 'typeorm_migrations',
      migrationsRun: true,
    };
  }
}
