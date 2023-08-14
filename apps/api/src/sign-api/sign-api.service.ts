import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserContextDto } from '../user/user.dto';
import { SignInitializeDto, SignJoinDto } from './sign-api.dto';
import { InjectPinoLogger } from 'nestjs-pino';
import { DevicesService } from '../devices/devices.service';
import { KeysService } from '../keys/keys.service';
import { UserService } from '../user/user.service';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class SignApiService {
  constructor(
    @InjectPinoLogger(SignApiService.name) private readonly logger,
    private readonly keysService: KeysService,
    private readonly deviceService: DevicesService,
    private readonly userService: UserService,
  ) {}

  async initiateSigning(user: UserContextDto, dto: SignInitializeDto) {
    const key = await this.keysService.findKey({ publicKey: dto.task.publicKey, participants: { userId: user.id } });
    if (!key) {
      throw new NotFoundException('Key not found');
    }

    const device = await this.deviceService.getDevice({ token: dto.externalSignerToken });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.user.id !== user.id) {
      throw new BadRequestException('Device does not belong to user');
    }

    if (!device.keys.some((k) => k.id === key.id)) {
      this.logger.error({ device, key, dto }, 'Device does not have the particular key');
      throw new BadRequestException('Device does not have the particular key');
    }
    
    await this.keysService.saveSign({
      keyId: key.id,
      timeoutSeconds: 60,
      publicKey: key.publicKey,
      participantsConfirmations: [1,2],
      data: dto.task.digest,
      metadata: dto.task.meta,
    }, user.id, dto.task.digest)

    await this.deviceService.sendPush(
      device,
      'Signing request',
      'You have a new signing request',
      dto as {},
    );

    return this.keysService.waitForSignature(dto.task.digest, 60 * 1000);
  }

  joinSigning(user: UserContextDto, body: SignJoinDto) {
    throw new Error('Method not implemented.');
  }
}
