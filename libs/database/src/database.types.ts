export type DatabaseConnection = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export type DatabaseConfig = {
  db: DatabaseConnection;
  isProduction: boolean;
};

export enum TaskStatus {
  Created = 'created',
  Started = 'started',
  Finished = 'finished',
  Error = 'error',
  Timeout = 'timeout',
}
