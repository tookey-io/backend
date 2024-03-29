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
import { JwtStrategy } from './strategies/jwt.strategy';
import { SigninKeyStrategy } from './strategies/signin-key.strategy';
import { FlowsModule } from '@tookey/flows';
import { AuthGoogleModule } from 'apps/api/src/auth-google/auth-google.module';

// Deprecated strategies
// import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
// import { ShareableKeyStrategy } from './strategies/shareable-key.strategy';
// import { WsJwtStrategy } from './strategies/ws-jwt.strategy';

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
        return { secret: jwt.secret, signOptions: { expiresIn: jwt.refreshTokenTTL } };
      },
    }),
    TwitterModule,
    DiscordModule,
    FlowsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    SigninKeyStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
