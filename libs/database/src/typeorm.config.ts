import { join } from 'path';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  username: process.env.PG_USER || 'user',
  password: process.env.PG_PASS || 'password',
  database: process.env.PG_DB || 'tookey',
  entities: [join(__dirname, '/entities/**.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  migrationsRun: true,
});

export default dataSource;
