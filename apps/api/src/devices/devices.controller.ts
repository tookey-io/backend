import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put, Sse } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { SignDto } from '../keys/keys.dto';
import { UserDto } from '../user/user.dto';
import { DeviceUpdateRequestDto, DevicesDto } from './devices.dto';
import { DevicesService } from './devices.service';
import { AnyRoles } from '../decorators/any-role.decorator';
import { Observable } from 'rxjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller('/api/devices')
@ApiTags('Devices')
export class DevicesController {
  constructor(
    @InjectPinoLogger(DevicesController.name) private readonly logger: PinoLogger,
    private readonly devicesService: DevicesService,
  ) {}

  @AnyRoles('user.devices.write')
  @JwtAuth()
  @ApiOperation({ description: 'Creates test sign request' })
  @ApiOkResponse({ type: SignDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Sign operation is forbidden' })
  @HttpCode(200)
  @Post('/sign/test')
  async sendTestSignRequest(@CurrentUser() user: UserDto) {
    await this.devicesService.sendTestSignRequest(user);
  }

  @AnyRoles('user.devices.write')
  @JwtAuth()
  @ApiOperation({ description: 'Creates or updates device token and available keys on it' })
  @ApiOkResponse({ type: SignDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Sign operation is forbidden' })
  @HttpCode(200)
  @Put('')
  async updateOrCreateDevice(@CurrentUser() user: UserDto, @Body() body: DeviceUpdateRequestDto) {
    return this.devicesService.updateDevice(body, user).then((device) => new DevicesDto({ ...device }));
  }

  @AnyRoles('user.devices.read')
  @JwtAuth()
  @ApiOperation({ description: 'Returns list of available devices for the particular key' })
  @ApiOkResponse({ type: DevicesDto, isArray: true })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Sign operation is forbidden' })
  @HttpCode(200)
  @Get('/key/:publicKey')
  async devicesForKey(@CurrentUser() user: UserDto, @Param('publicKey') publicKey: string) {
    return this.devicesService
      .getForKey(publicKey, user)
      .then((devices) => devices.map((device) => new DevicesDto({ ...device })));
  }

  @AnyRoles('user.devices.read')
  @JwtAuth()
  @ApiOperation({ description: 'Returns list of your devices' })
  @ApiOkResponse({ type: DevicesDto, isArray: true })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Sign operation is forbidden' })
  @HttpCode(200)
  @Get('/my')
  async devicesForUser(@CurrentUser() user: UserDto) {
    return this.devicesService
      .getForUser(user)
      .then((devices) => devices.map((device) => new DevicesDto({ ...device })));
  }

  @AnyRoles('user.devices.write')
  @JwtAuth()
  @ApiOperation({ description: 'Sends test notification to your devices' })
  @ApiOkResponse({ type: DevicesDto, isArray: true })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Sign operation is forbidden' })
  @HttpCode(200)
  @Post('/test')
  async testNotification(@CurrentUser() user: UserDto) {
    const devices = await this.devicesService.getForUser(user);
    return await Promise.all(
      devices.map((d) => this.devicesService.sendPush(d, 'Test', 'Test notification', { test: 'test' })),
    );
  }

  @AnyRoles('user.devices.write')
  @JwtAuth()
  @ApiOperation({ description: 'Listen notifications from device' })
  @Sse('/listen/:token')
  async listen(@CurrentUser() user: UserDto, @Param('token') token: string): Promise<Observable<any>> {
    this.logger.info(`/sse Listen for device ${token}`);
    const device = await this.devicesService.getDevice({ token });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.devicesService.listen(device);
  }
}
