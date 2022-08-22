export type DatabaseConnection = {
    host: string
    port: number
    username: string
    password: string
    database: string
}

export type DatabaseConfig = {
    db: DatabaseConnection
    isProduction: boolean
}