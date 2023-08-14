import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlowsConfig } from './flows.types';
import { ExternalUserAuthDto, ExternalUserInjectDto } from './flows.dto';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Flow, SeekPage } from '@activepieces/shared';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class FlowsService {
  async call(userId: number, flow: string) {
    const backendUrl = this.config.get('flows.backendUrl', { infer: true });
    if (typeof backendUrl === 'undefined') throw new BadGatewayException('No backendUrl provided for flows service');

    // TODO: add context
    return firstValueFrom(this.httpService.post(`${backendUrl}/v1/webhooks/${flow}/sync`));
  }

  private authToken?: string;
  private cachedTokens: Partial<Record<string, string>> = {};

  constructor(
    @InjectPinoLogger(FlowsService.name) private readonly logger: PinoLogger,
    private readonly httpService: HttpService,
    private readonly config: ConfigService<{ flows: FlowsConfig }>,
  ) {}

  private async getUserAuthToken(user: ExternalUserAuthDto) {
    if (!this.cachedTokens[user.id]) {
      this.cachedTokens[user.id] = await this.authUser(user).then(({ token }) => token);
    }

    return this.cachedTokens[user.id];
  }

  async getUserVerificationFlows(user: ExternalUserAuthDto) {
    const backendUrl = this.config.get('flows.backendUrl', { infer: true });
    if (typeof backendUrl === 'undefined') throw new BadGatewayException('No backendUrl provided for flows service');

    const token = await this.getUserAuthToken(user);
    try {
      const flows = await firstValueFrom(
        this.httpService.get<SeekPage<Flow>>(`${backendUrl}/v1/flows?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ).then((response) => response.data.data.filter((d) => d.status === 'ENABLED'));

      this.logger.info(`Got ${flows.length} flows for user ${user.id}`);
      return flows;
    } catch (e: unknown) {
      console.error(e);
      this.logger.error(e);
      return [];
    }
  }

  getAuthUrl(otp: string) {
    const frontendUrl = this.config.get('flows.frontendUrl', { infer: true });
    if (typeof frontendUrl === 'undefined') throw new BadGatewayException('No frontendUrl provided for flows service');

    return `${frontendUrl}/sign-in?otp=${otp}`;
  }
  getAuthEndEditUrl(flowId: string, otp: string) {
    const frontendUrl = this.config.get('flows.frontendUrl', { infer: true })!;
    return this.getAuthUrl(otp) + `&redirect_url=${frontendUrl}/flows/${flowId}`;
  }

  async authService() {
    const backendUrl = this.config.get('flows.backendUrl', { infer: true });
    const password = this.config.get('flows.password', { infer: true }) || 'super-secret';

    if (typeof password === 'undefined') throw new UnauthorizedException('No password provided for flows service');
    if (typeof backendUrl === 'undefined') throw new BadGatewayException('No backendUrl provided for flows service');

    const response = await firstValueFrom(
      this.httpService.post<{ token: string }>(`${backendUrl}/v1/authentication/external/service/auth`, { password }),
    );

    this.logger.info('Authenticated with flows service: ' + response.data.token);

    this.authToken = response.data.token;
  }

  async injectUser(user: ExternalUserInjectDto) {
    if (typeof this.authToken === 'undefined') {
      try {
        await this.authService();
      } catch (e: unknown) {
        throw new UnauthorizedException('Unable to authenticate with flows service');
      }
    }

    const backendUrl = this.config.get('flows.backendUrl', { infer: true });

    if (typeof backendUrl === 'undefined') throw new BadGatewayException('No backendUrl provided for flows service');

    try {
      return await firstValueFrom(
        this.httpService.post(
          `${backendUrl}/v1/authentication/external/user/inject`,
          {
            ...user,
            id: `external-${user.id}`,
          },
          {
            headers: {
              Authorization: `Bearer ${this.authToken}`,
            },
          },
        ),
      ).then(({ data }) => data);
    } catch (e: unknown) {
      if (e instanceof AxiosError && e.response.data.code === 'EXISTING_USER') {
        // auth
        return null;
      }
      throw e;
    }
  }

  async authUser(dto: ExternalUserAuthDto) {
    if (typeof this.authToken === 'undefined') {
      try {
        await this.authService();
      } catch (e: unknown) {
        throw new UnauthorizedException('Unable to authenticate with flows service');
      }
    }

    const backendUrl = this.config.get('flows.backendUrl', { infer: true });
    if (typeof backendUrl === 'undefined') throw new BadGatewayException('No backendUrl provided for flows service');

    const signIn = await firstValueFrom(
      this.httpService.post<{ token: string }>(
        `${backendUrl}/v1/authentication/external/user/auth`,
        {
          id: `external-${dto.id}`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        },
      ),
    ).then(({ data }) => data);

    if (dto.token) {
      await firstValueFrom(
        this.httpService.post<unknown>(
          `${backendUrl}/v1/app-connections`,
          {
            appName: '@activepieces/piece-tookey-wallet',
            name: 'tookey-wallet',
            value: { secret_text: dto.token, type: 'SECRET_TEXT' },
          },
          {
            headers: {
              Authorization: `Bearer ${signIn.token}`,
            },
          },
        ),
      );
    }

    return signIn;
  }
}
