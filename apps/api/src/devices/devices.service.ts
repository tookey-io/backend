import { Inject, Injectable, OnApplicationBootstrap, UnauthorizedException, forwardRef } from '@nestjs/common';
import { DeviceUpdateRequestDto, DevicesDto } from './devices.dto';
import { KeysService } from '../keys/keys.service';
import { UserDto } from '../user/user.dto';
import { UserDevice, UserDeviceRepository } from '@tookey/database';
import * as firebaseAdmin from 'firebase-admin';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Injectable()
export class DevicesService implements OnApplicationBootstrap {
  app: firebaseAdmin.app.App;

  constructor(
    @InjectPinoLogger(DevicesService.name) private readonly logger: PinoLogger,
    private readonly emitter: EventEmitter2,
    private readonly keyService: KeysService,
    private readonly devices: UserDeviceRepository,
  ) {}

  onApplicationBootstrap() {
    this.app = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.applicationDefault(),
    });

    this.logger.info('Firebase app initialized');
  }

  async sendPush(device: UserDevice, title: string, body: string, payload?: Record<string, string>) {
    try {
      await firebaseAdmin.messaging().send({
        notification: {
          title,
          body,
        },
        token: device.token,
        data: { json: JSON.stringify(payload) },
        android: {
          priority: 'high',
        },
      });
    } catch (e: unknown) {
      this.logger.error(e, 'Failed to send push notification');
      this.logger.info({ device, title, body, payload }, 'Push sent');
      this.emitter.emit(`message.${device.token}`, payload);
    }

  }

  async updateDevice(dto: DeviceUpdateRequestDto, user: UserDto) {
    const keys = await this.keyService.getKeysByPublicKeys(dto);

    return this.devices.createOrUpdateOne({
      ...dto,
      user,
      keys: keys,
    });
  }

  getDevice(dto: Partial<Pick<UserDevice, 'token'>>) {
    return this.devices.findOne({ where: dto, relations: ['user', 'keys'] });
  }

  getForUser(user: UserDto) {
    return this.devices.findBy({ user: { id: user.id } });
  }

  async getForKey(publicKey: string, user: UserDto) {
    const key = await this.keyService.getKeyByPublicKey(publicKey);
    if (key.user.id !== user.id) {
      // TODO: Api key check
      throw new UnauthorizedException('Key does not belong to user');
    }

    return key.devices;
  }

  async sendTestSignRequest(user: UserDto) {
    const devices = await this.getForUser(user);
  }

  listen(device: UserDevice): Observable<any> {
    return fromEvent(this.emitter, `message.${device.token}`).pipe(map((event) => ({ data: JSON.stringify(event) })));
  }
}
