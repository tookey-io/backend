import { AppConfiguration } from 'apps/app/src/app.config';
import { addSeconds, formatISO } from 'date-fns';

import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: DeepMocked<JwtService>;
  let configService: DeepMocked<ConfigService<AppConfiguration>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: createMock<JwtService>() },
        { provide: ConfigService, useValue: createMock<ConfigService<AppConfiguration>>() },
      ],
    }).compile();

    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    authService = module.get(AuthService);
  });

  test('getJwtAccessToken returns a valid JWT access token', () => {
    const userId = 1;
    const jwt = {
      accessTokenSecret: 'secret',
      accessTokenTTL: 3600,
    };
    configService.get.mockReturnValue(jwt);
    jwtService.sign.mockReturnValue('token');

    const token = authService.getJwtAccessToken(userId);

    expect(token.token).toEqual('token');
    expect(configService.get).toHaveBeenCalledWith('jwt', { infer: true });
    expect(jwtService.sign).toHaveBeenCalledWith(
      { id: userId },
      {
        secret: jwt.accessTokenSecret,
        expiresIn: jwt.accessTokenTTL,
      },
    );
    expect(token.validUntil).toEqual(formatISO(addSeconds(new Date(), 3600)));
  });

  test('getJwtRefreshToken returns a valid JWT refresh token', () => {
    const userId = 1;
    const jwt = {
      refreshTokenSecret: 'secret',
      refreshTokenTTL: 86400,
    };
    configService.get.mockReturnValue(jwt);
    jwtService.sign.mockReturnValue('token');

    const token = authService.getJwtRefreshToken(userId);

    expect(token.token).toEqual('token');
    expect(configService.get).toHaveBeenCalledWith('jwt', { infer: true });
    expect(jwtService.sign).toHaveBeenCalledWith(
      { id: userId },
      {
        secret: jwt.refreshTokenSecret,
        expiresIn: jwt.refreshTokenTTL,
      },
    );
    expect(token.validUntil).toEqual(formatISO(addSeconds(new Date(), 86400)));
  });

  test('getJwtAccessToken and getJwtRefreshToken throw an error if the jwt configuration is not set or is invalid', () => {
    configService.get.mockReturnValue(null);

    expect(() => authService.getJwtAccessToken(1)).toThrowError('Invalid JWT Access Token configuration');
    expect(() => authService.getJwtRefreshToken(1)).toThrowError('Invalid JWT Refresh Token configuration');
    expect(configService.get).toHaveBeenCalledWith('jwt', { infer: true });
  });

  test('getJwtAccessToken and getJwtRefreshToken use the correct secret and expiration time values from the jwt configuration', () => {
    const userId = 1;
    const jwt = {
      accessTokenSecret: 'secret',
      accessTokenTTL: 3600,
      refreshTokenSecret: 'secret',
      refreshTokenTTL: 86400,
    };
    configService.get.mockReturnValue(jwt);
    jwtService.sign.mockReturnValue('token');

    const accessToken = authService.getJwtAccessToken(userId);
    expect(accessToken.token).toEqual('token');
    expect(configService.get).toHaveBeenCalledWith('jwt', { infer: true });
    expect(jwtService.sign).toHaveBeenCalledWith(
      { id: userId },
      {
        secret: jwt.accessTokenSecret,
        expiresIn: jwt.accessTokenTTL,
      },
    );
    expect(accessToken.validUntil).toEqual(formatISO(addSeconds(new Date(), 3600)));

    const refreshToken = authService.getJwtRefreshToken(userId);
    expect(refreshToken.token).toEqual('token');
    expect(configService.get).toHaveBeenCalledWith('jwt', { infer: true });
    expect(jwtService.sign).toHaveBeenCalledWith(
      { id: userId },
      {
        secret: jwt.refreshTokenSecret,
        expiresIn: jwt.refreshTokenTTL,
      },
    );
    expect(refreshToken.validUntil).toEqual(formatISO(addSeconds(new Date(), 86400)));
  });
});
