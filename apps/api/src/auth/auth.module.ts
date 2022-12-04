import { AppConfiguration } from 'apps/app/src/app.config';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessModule } from '@tookey/access';

import { PermissionModule } from '../permission/permission.module';
import { AuthKeyStrategy } from '../strategies/auth-key.strategy';
import { JwtRefreshTokenStrategy } from '../strategies/jwt-refresh-token.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PermissionKeyStrategy } from '../strategies/permission-key.strategy';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    AccessModule,
    UserModule,
    PassportModule,
    PermissionModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfiguration>) => {
        const jwt = configService.get('jwt', { infer: true });
        return { secret: jwt.accessTokenSecret, signOptions: { expiresIn: jwt.accessTokenTTL } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtRefreshTokenStrategy, JwtStrategy, AuthKeyStrategy, PermissionKeyStrategy],
})
export class AuthModule {}
