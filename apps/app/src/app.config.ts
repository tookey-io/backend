import { BotConfig } from 'apps/bot/src/bot.types';

import { AccessConfig } from '@tookey/access';
import { DatabaseConfig, DatabaseConnection } from '@tookey/database';

export type AmpqConnection = {
  uri: string | string[];
  topics: string[];
};

export type AmpqConfig = {
  amqp: AmpqConnection;
};

export class AppConfiguration
  implements BotConfig, DatabaseConfig, AccessConfig, AmpqConfig
{
  defaultTtl: number;
  telegramToken: string;
  appName: string;
  port: number;
  isProduction: boolean;
  db: DatabaseConnection;
  amqp: AmpqConnection;
  healthTimeout: number;
}

export function configuration(): AppConfiguration {
  return {
    defaultTtl: parseInt(process.env.ACCESS_TOKEN_TTL) || 1000 * 60 * 60 * 24, // 1 day by default
    telegramToken: process.env.TELEGRAM_TOKEN,
    appName: process.env.APP_NAME || 'tookey',
    port: parseInt(process.env.PORT, 10),
    isProduction: process.env.NODE_ENV === 'production',
    db: {
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT, 10),
      username: process.env.PG_USER,
      password: process.env.PG_PASS,
      database: process.env.PG_DB,
    },
    amqp: {
      uri: process.env.AMQP_URI,
      topics: process.env.AMQP_TOPICS ? process.env.AMQP_TOPICS.split(',') : [],
    },
    healthTimeout:
      (process.env.HEALTH_TIMEOUT
        ? parseInt(process.env.HEALTH_TIMEOUT, 10)
        : 120) * 1_000,
  };
}
