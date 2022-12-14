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

export type JWTConfig = {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTTL: number;
  refreshTokenTTL: number;
};

export type TwitterConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

export type CorsConfig = {
  origin: string | string[];
  allowedHeaders: string;
  methods: string;
};

export class AppConfiguration implements BotConfig, DatabaseConfig, AccessConfig, AmpqConfig {
  defaultTtl: number;
  telegramToken: string;
  telegramBotName: string;
  telegramExceptionsChatId: number;
  appName: string;
  appUrl: string;
  port: number;
  isProduction: boolean;
  jwt: JWTConfig;
  twitter: TwitterConfig;
  db: DatabaseConnection;
  amqp: AmpqConnection;
  healthTimeout: number;
  cors: CorsConfig;
}

export function configuration(): AppConfiguration {
  return {
    defaultTtl: parseInt(process.env.ACCESS_TOKEN_TTL) || 1000 * 60, // 1 min
    telegramToken: process.env.TELEGRAM_TOKEN,
    telegramBotName: process.env.TELEGRAM_BOT_NAME || 'tookey_bot',
    telegramExceptionsChatId: parseInt(process.env.TELEGRAM_EXCEPTIONS_CHAT_ID),
    appName: process.env.APP_NAME || 'tookey',
    appUrl: process.env.APP_URL,
    port: parseInt(process.env.PORT, 10),
    isProduction: process.env.NODE_ENV === 'production',
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'secret_access',
      accessTokenTTL: parseInt(process.env.JWT_ACCESS_TOKEN_TTL) || 60 * 15, // 15 min
      refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'secret_refresh',
      refreshTokenTTL: parseInt(process.env.JWT_REFRESH_TOKEN_TTL) || 60 * 60 * 24 * 7, // 7 days
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackUrl: process.env.TWITTER_CALLBACK_URL,
    },
    db: {
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT, 10),
      username: process.env.PG_USER,
      password: process.env.PG_PASS,
      database: process.env.PG_DB,
      ssl: !!process.env.PG_SSL,
    },
    amqp: {
      uri: process.env.AMQP_URI,
      topics: process.env.AMQP_TOPICS ? process.env.AMQP_TOPICS.split(',') : [],
    },
    healthTimeout: (process.env.HEALTH_TIMEOUT ? parseInt(process.env.HEALTH_TIMEOUT, 10) : 120) * 1_000,
    cors: {
      origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
      allowedHeaders: process.env.CORS_ALLOWED_HEADERS ? process.env.CORS_ALLOWED_HEADERS : '*',
      methods: process.env.CORS_METHODS ? process.env.CORS_METHODS : '*',
    },
  };
}
