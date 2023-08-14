export type DatabaseConnection = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
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

export enum UserDeviceType {
  Listener = 'listener',
  FirebaseMessaging = 'firebase-messaging',
}