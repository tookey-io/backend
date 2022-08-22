import { DatabaseConfig, DatabaseConnection } from "@tookey/database/database.types"
import { BotConfig } from "apps/bot/src/bot.types"
import { AccessConfig } from "libs/access/src/access.types"

export class AppConfiguration implements BotConfig, DatabaseConfig, AccessConfig {
    defaultTtl: number
    token: string
    appName: string
    port: number
    isProduction: boolean
    db: DatabaseConnection
    healthTimeout: number
}

export function configuration(): AppConfiguration {
    return {
        defaultTtl: parseInt(process.env.ACCESS_TOKEN_TTL) || (1000 * 60 * 60 * 24), // 1 day by default
        token: process.env.TELEGRAM_TOKEN,
        appName: process.env.APP_NAME || 'offchain',
        port: parseInt(process.env.PORT, 10),
        isProduction: process.env.NODE_ENV === 'production',
        db: {
            host: process.env.PG_HOST,
            port: parseInt(process.env.PG_PORT, 10),
            username: process.env.PG_USER,
            password: process.env.PG_PASS,
            database: process.env.PG_DB,
        },
        healthTimeout: (process.env.HEALTH_TIMEOUT ? parseInt(process.env.HEALTH_TIMEOUT, 10) : 120) * 1_000,
    }
}
