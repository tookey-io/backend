import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfiguration } from '../../app/src/app.config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DiscordModule } from './discord/discord.module';
import { KeyModule } from './keys/keys.module';
import { PipefyModule } from './pipefy/pipefy.module';
import { ShareableTokenModule } from './shareable-token/shareable-token.module';
import { TwitterModule } from './twitter/twitter.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { DevicesModule } from './devices/devices.module';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { SignApiService } from './sign-api/sign-api.service';
import { SignApiController } from './sign-api/sign-api.controller';
import { PiecesModule } from './pieces/pieces.module';
import { AuthGoogleModule } from 'apps/api/src/auth-google/auth-google.module';
import { AuthEmailService } from './auth-email/auth-email.service';
import { AuthEmailModule } from './auth-email/auth-email.module';
import { AuthDiscordModule } from './auth-discord/auth-discord.module';
import { AuthTwitterModule } from './auth-twitter/auth-twitter.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfiguration>) => ({
        prefix: 'rps',
        redis: configService.get('redis', { infer: true }),
      }),
    }),
    KeyModule,
    UserModule,
    AuthEmailModule,
    AuthGoogleModule,
    AuthDiscordModule,
    AuthTwitterModule,
    AuthModule,
    ShareableTokenModule,
    TwitterModule,
    DiscordModule,
    PipefyModule,
    WalletModule,
    AdminModule,
    DevicesModule,
    PiecesModule,
  ],
  controllers: [ApiController, SignApiController],
  providers: [ApiService, SignApiService, AuthEmailService],
})
export class ApiModule {}
