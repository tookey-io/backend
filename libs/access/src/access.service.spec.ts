import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessTokenRepository } from '../../database/src';
import { accessTokenMock, refreshedAccessTokenMock } from '../../database/src/mocks/access-token.mock';
import { AccessService } from './access.service';

describe('AccessService', () => {
  let service: AccessService;
  let configServiceMock: DeepMocked<ConfigService>;
  let accessTokenRepositoryMock: DeepMocked<AccessTokenRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessService,
        { provide: ConfigService, useValue: createMock<ConfigService>() },
        { provide: AccessTokenRepository, useValue: createMock<AccessTokenRepository>() },
      ],
    }).compile();

    service = module.get<AccessService>(AccessService);
    configServiceMock = module.get(ConfigService);
    accessTokenRepositoryMock = module.get(AccessTokenRepository);
  });

  describe('when requesting access token', () => {
    const userId = 1;
    const defaultTtl = 10000;
    beforeEach(() => {
      configServiceMock.get.mockReturnValue(defaultTtl);
    });

    describe('and valid token found', () => {
      beforeEach(() => {
        accessTokenRepositoryMock.findOneBy.mockResolvedValue(accessTokenMock);
      });
      it('should return token', async () => {
        const response = await service.getAccessToken(userId);
        expect(response).toEqual(accessTokenMock);
      });
    });

    describe('and valid token not found', () => {
      beforeEach(() => {
        accessTokenRepositoryMock.findOneBy.mockResolvedValue(null);
        accessTokenRepositoryMock.create.mockReturnValue(refreshedAccessTokenMock);
        accessTokenRepositoryMock.delete.mockResolvedValue({ affected: 1, raw: {} });
        accessTokenRepositoryMock.createOrUpdateOne.mockResolvedValue(refreshedAccessTokenMock);
      });
      it('should return refreshed token', async () => {
        const response = await service.getAccessToken(userId);
        expect(response).toEqual(refreshedAccessTokenMock);
      });
    });
  });
});
