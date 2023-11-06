import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmExModule } from '@tookey/database';
import { SecretsRepository } from '@tookey/database';
import { SecretsController } from './secrets.controller';
import { SecretsService } from './secrets.service';

const SecretRepositories = TypeOrmExModule.forCustomRepository([SecretsRepository]);

@Module({
    imports: [ConfigModule, HttpModule, SecretRepositories],
    controllers: [SecretsController],
    providers: [SecretsService]
})
export class SecretsModule {}
