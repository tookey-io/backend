import { DataSource } from 'typeorm';

import * as entities from './entities';
import * as migrations from './migrations';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  username: process.env.PG_USER || 'user',
  password: process.env.PG_PASS || 'password',
  database: process.env.PG_DB || 'tookey',
  entities,
  migrations,
  migrationsTableName: 'migrations',
  migrationsRun: true,
});

export default dataSource;
