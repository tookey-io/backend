import { AppConfiguration } from 'apps/app/src/app.config';

import { GraphQLRequestModule } from '@golevelup/nestjs-graphql-request';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PipefyRepository, TypeOrmExModule } from '@tookey/database';

import { PipefyEventsHandler } from './pipefy.events';
import { PipefyService } from './pipefy.service';

const PipefyRepositories = TypeOrmExModule.forCustomRepository([PipefyRepository]);

@Module({
  imports: [
    PipefyRepositories,
    GraphQLRequestModule.forRootAsync(GraphQLRequestModule, {
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfiguration>) => {
        const { endpoint, authorization } = configService.get('pipefy', { infer: true });
        return {
          endpoint,
          options: { headers: { accept: 'application/json', 'content-type': 'application/json', authorization } },
        };
      },
    }),
  ],
  providers: [PipefyService, PipefyEventsHandler],
  exports: [PipefyService, PipefyRepositories],
})
export class PipefyModule {}
