import { AppConfiguration } from 'apps/app/src/app.config';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessModule } from '@tookey/access';
import { TypeOrmExModule, UserDiscordRepository } from '@tookey/database';

import { DiscordModule } from '../discord/discord.module';
import { ShareableTokenModule } from '../shareable-token/shareable-token.module';
import { TwitterModule } from '../twitter/twitter.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ShareableKeyStrategy } from './strategies/shareable-key.strategy';
import { SigninKeyStrategy } from './strategies/signin-key.strategy';
import { WsJwtStrategy } from './strategies/ws-jwt.strategy';

const AuthRepositories = TypeOrmExModule.forCustomRepository([UserDiscordRepository]);

@Module({
  imports: [
    AuthRepositories,
    AccessModule,
    UserModule,
    PassportModule,
    ShareableTokenModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfiguration>) => {
        const jwt = configService.get('jwt', { infer: true });
        return { secret: jwt.accessTokenSecret, signOptions: { expiresIn: jwt.accessTokenTTL } };
      },
    }),
    TwitterModule,
    DiscordModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtRefreshTokenStrategy,
    JwtStrategy,
    WsJwtStrategy,
    SigninKeyStrategy,
    ShareableKeyStrategy,
  ],
})
export class AuthModule {}
