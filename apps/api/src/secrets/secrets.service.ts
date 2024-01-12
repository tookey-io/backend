import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SecretEntity, SecretsRepository } from '@tookey/database/entities/secrets.entity';
import { firstValueFrom } from 'rxjs';
import {
  AuthorizationMethod,
  ClaimConnectionDto,
  CreateOrUpdateSecretDto,
  Edition,
  RefreshConnectionDto,
} from './secrets.dto';
import { mergeWith } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from 'apps/app/src/app.config';
import axios from 'axios';

@Injectable()
export class SecretsService {
  constructor(
    private secrets: SecretsRepository,
    private httpService: HttpService,
    private config: ConfigService<AppConfiguration>,
  ) {}

  async refresh(appConnection: RefreshConnectionDto) {
    const { clientSecret, redirectUrl, contentType } = await this.getSecretById(appConnection.clientId);
    const body: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: appConnection.refreshToken,
      redirect_uri: redirectUrl || this.config.getOrThrow('publicUrl') + '/api/secrets/redirect',
    };

    const headers: Record<string, string> = {
      'content-type': contentType || 'application/x-www-form-urlencoded',
      accept: 'application/json',
    };

    const authorizationMethod = appConnection.authorizationMethod || AuthorizationMethod.BODY;

    switch (authorizationMethod) {
      case AuthorizationMethod.BODY:
        body.client_id = appConnection.clientId;
        body.client_secret = clientSecret;
        break;
      case AuthorizationMethod.HEADER:
        headers.authorization = `Basic ${Buffer.from(`${appConnection.clientId}:${clientSecret}`).toString('base64')}`;
        break;
      default:
        throw new Error(`Unknown authorization method: ${authorizationMethod}`);
    }

    const claimed_at = Math.round(Date.now() / 1000);
    const response = await firstValueFrom(
      this.httpService.post(appConnection.tokenUrl, contentType === 'application/json' ? body : new URLSearchParams(body), {
        headers,
        timeout: 10000,
      }),
    ).then((r) => r.data);

    return {
      ...response,
      claimed_at,
      data: {},
    };

    // return new OAuthResponse(mergeappConnection, response);
    // const mergedObject = mergeNonNull(
    //     appConnection,
    //     formatOAuth2Response({ ...response }),
    // )
    // return mergedObject
  }

  async claim(dto: ClaimConnectionDto) {
    const { clientSecret, redirectUrl, contentType } = await this.getSecretById(dto.clientId);
    console.log('claim request', dto, clientSecret, redirectUrl, contentType)
    const redirect_uri = redirectUrl || this.config.getOrThrow('publicUrl') + '/api/secrets/redirect';
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      redirect_uri,
      code: dto.code,
    };

    if (dto.codeVerifier) {
      body.code_verifier = dto.codeVerifier;
    }
    const headers: Record<string, string> = {
      'content-type': contentType || 'application/x-www-form-urlencoded',
      accept: 'application/json',
    };
    const authorizationMethod = dto.authorizationMethod || AuthorizationMethod.BODY;
    switch (authorizationMethod) {
      case AuthorizationMethod.BODY:
        body.client_id = dto.clientId;
        body.client_secret = clientSecret;
        break;
      case AuthorizationMethod.HEADER:
        headers.authorization = `Basic ${Buffer.from(`${dto.clientId}:${clientSecret}`).toString('base64')}`;
        break;
      default:
        throw new Error(`Unknown authorization method: ${authorizationMethod}`);
    }
    const claimed_at = Math.round(Date.now() / 1000);
    
    console.log(contentType, body, dto, headers);
    const response = await axios.post(dto.tokenUrl, contentType === 'application/json' ? body : new URLSearchParams(body), {
        headers,
      })
      .then((r) => r.data)
      .catch((e) => {
        console.error(e);
        throw e;
      });

    return {
      ...response,
      claimed_at,
      data: {},
    };
  }

  async getClientIds(edition: Edition, admin: boolean) {
    const secrets = await this.secrets.find({});
    return Object.fromEntries(
      secrets.map(({ pieceName, clientId, clientSecret }) => [
        pieceName,
        { clientId, clientSecret: admin ? clientSecret : undefined },
      ]),
    );
  }

  getSecretById(clientId: string) {
    try {
      return this.secrets.findOneByOrFail({ clientId });
    } catch (e) {
      throw new NotFoundException(`Secret for clientId ${clientId} not found`);
    }
  }

  async create(dto: CreateOrUpdateSecretDto) {
    const found = await this.secrets.findOneByPieceName(dto.pieceName);

    if (found) {
      throw new BadRequestException(`Secret for clientId ${dto.clientId} already exists`);
    }

    return this.secrets.createOrUpdateOne(dto);
  }

  async update(dto: CreateOrUpdateSecretDto) {
    const found = await this.secrets.findOneByPieceName(dto.pieceName);

    if (!found) {
      throw new NotFoundException(`Secret for clientId ${dto.clientId} not found`);
    }

    found.clientId = dto.clientId;
    found.clientSecret = dto.clientSecret;
    return this.secrets.save(found);
  }
}
