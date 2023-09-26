import { BotConfig } from 'apps/bot/src/bot.types';

import { AccessConfig } from '@tookey/access';
import { DatabaseConfig, DatabaseConnection } from '@tookey/database';
import { FlowsConfig } from '@tookey/flows';

export type AmpqConnection = {
  uri: string | string[];
  topics: string[];
};

export type AmpqConfig = {
  amqp: AmpqConnection;
};

export type JWTConfig = {
  secret: string;
  accessTokenTTL: number;
  refreshTokenTTL: number;
};

export type TwitterConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

export type DiscordConfig = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
};

export type CorsConfig = {
  origin: boolean | string | string[];
  allowedHeaders: string;
  methods: string;
};

export type RedisConfig = {
  host: string;
  port: number;
};

export type PipefyConfig = {
  endpoint: string;
  authorization: string;
};

export type EthersConfig = {
  network?: string;
  secret: string;
};

export class AppConfiguration implements BotConfig, DatabaseConfig, AccessConfig, AmpqConfig {
  publicUrl: string;
  flows: FlowsConfig;
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
  discord: DiscordConfig;
  db: DatabaseConnection;
  amqp: AmpqConnection;
  healthTimeout: number;
  cors: CorsConfig;
  redis: RedisConfig;
  pipefy: PipefyConfig;
  ethers: EthersConfig;
}

export function configuration(): AppConfiguration {
  if (!process.env.PUBLIC_URL) {
    throw new Error("PUBLIC_URL environment variable is required");
  }

  return {
    publicUrl: process.env.PUBLIC_URL,
    defaultTtl: parseInt(process.env.ACCESS_TOKEN_TTL) || 1000 * 60, // 1 min
    telegramToken: process.env.TELEGRAM_TOKEN,
    telegramBotName: process.env.TELEGRAM_BOT_NAME || 'tookey_bot',
    telegramExceptionsChatId: parseInt(process.env.TELEGRAM_EXCEPTIONS_CHAT_ID),
    appName: process.env.APP_NAME || 'tookey',
    appUrl: process.env.APP_URL,
    port: parseInt(process.env.PORT, 10),
    isProduction: process.env.NODE_ENV === 'production',
    flows: {
      backendUrl: process.env.FLOWS_BACKEND_URL || "http://127.0.0.1:3000",
      frontendUrl: process.env.FLOWS_FRONTEND_URL || "http://127.0.0.1:4200",
      password: process.env.FLOWS_PASSWORD || "super-secret",
    },
    jwt: {
      // TODO: rename to JWT_SECRET
      secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'secret_refresh',
      accessTokenTTL: parseInt(process.env.JWT_ACCESS_TOKEN_TTL) || 60 * 15, // 15 min
      refreshTokenTTL: parseInt(process.env.JWT_REFRESH_TOKEN_TTL) || 60 * 60 * 24 * 7, // 7 days
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackUrl: process.env.TWITTER_CALLBACK_URL,
    },
    discord: {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
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
      origin: process.env.CORS_ORIGINS && process.env.CORS_ORIGINS !== "*" ? process.env.CORS_ORIGINS.split(',') : true,
      allowedHeaders: process.env.CORS_ALLOWED_HEADERS ? process.env.CORS_ALLOWED_HEADERS : '*',
      methods: process.env.CORS_METHODS ? process.env.CORS_METHODS : '*',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    },
    pipefy: {
      endpoint: process.env.PIPEFY_ENDPOINT || 'https://api.pipefy.com/graphql',
      authorization: process.env.PIPEFY_AUTH || '',
    },
    ethers: {
      network: process.env.ETHERS_NETWORK,
      secret: process.env.ETHERS_SECRET || 'ethers_secret',
    },
  };
}
