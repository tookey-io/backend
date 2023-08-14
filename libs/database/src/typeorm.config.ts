import { DataSource } from 'typeorm';

import * as entities from './entities';
import * as migrations from './migrations';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST || '127.0.0.1',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5433,
  username: process.env.PG_USER || 'user',
  password: process.env.PG_PASS || 'password',
  database: process.env.PG_DB || 'tookey',
  entities,
  migrations,
  migrationsTableName: 'migrations',
  migrationsRun: true,
});

export default dataSource;
