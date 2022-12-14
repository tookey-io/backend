import { AppConfiguration } from 'apps/app/src/app.config';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessModule } from '@tookey/access';

import { ShareableTokenModule } from '../shareable-token/shareable-token.module';
import { JwtRefreshTokenStrategy } from '../strategies/jwt-refresh-token.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { ShareableKeyStrategy } from '../strategies/shareable-key.strategy';
import { SigninKeyStrategy } from '../strategies/signin-key.strategy';
import { TwitterModule } from '../twitter/twitter.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtRefreshTokenStrategy, JwtStrategy, SigninKeyStrategy, ShareableKeyStrategy],
})
export class AuthModule {}
