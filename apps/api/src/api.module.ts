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
  providers: [ApiService, SignApiService],
})
export class ApiModule {}
