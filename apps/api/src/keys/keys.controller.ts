import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiRequestTimeoutResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AmqpPayload, AmqpSubscribe } from '@tookey/amqp';

import { AmqpPayloadDto } from '../ampq.dto';
import { AnyRoles } from '../decorators/any-role.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import {
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeyListResponseDto,
  KeySignRequestDto,
  SignDto,
} from './keys.dto';
import { KeysService } from './keys.service';

@Controller('api/keys')
@ApiTags('Keys')
@UseInterceptors(ClassSerializerInterceptor)
export class KeysController {
  constructor(
    @InjectPinoLogger(KeysController.name) private readonly logger: PinoLogger,
    private readonly keysService: KeysService,
  ) {}

  @AnyRoles('user.keys.write')
  @JwtAuth()
  @ApiOperation({ description: 'Create a Key' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Rejected by user' })
  @ApiRequestTimeoutResponse()
  @ApiInternalServerErrorResponse()
  @HttpCode(200)
  @Post()
  createKey(@Body() dto: KeyCreateRequestDto, @CurrentUser() user: UserContextDto): Promise<KeyDto> {
    return this.keysService.createKey(dto, user.id);
  }

  @AnyRoles('user.keys.read')
  @JwtAuth()
  @ApiOperation({ description: 'Get a Key' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @Get(':id')
  getKey(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserContextDto): Promise<KeyDto> {
    return this.keysService.getKey({ id }, user.id);
  }

  @AnyRoles('user.keys.read')
  @JwtAuth()
  @ApiOperation({ description: 'Get Keys List' })
  @ApiOkResponse({ type: KeyListResponseDto })
  @Get()
  getKeyList(@CurrentUser() user: UserContextDto): Promise<KeyListResponseDto> {
    return this.keysService.getKeyList(user.id);
  }

  @AnyRoles('user.keys.write')
  @JwtAuth()
  @ApiOperation({ description: 'Delete a Key' })
  @ApiOkResponse({ type: KeyDeleteResponseDto })
  @Delete()
  deleteKey(@Body() dto: KeyDeleteRequestDto, @CurrentUser() user: UserContextDto): Promise<KeyDeleteResponseDto> {
    return this.keysService.softDelete(dto, user.id);
  }

  @AnyRoles('user.keys.use')
  @JwtAuth()
  @ApiOperation({ description: 'Sign a hash' })
  @ApiOkResponse({ type: SignDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse({ description: 'Receives sign request from an external signer' })
  @HttpCode(200)
  @Post('sign')
  receiveParticipationRequest(@Body() dto: KeySignRequestDto, @CurrentUser() user: UserContextDto): Promise<SignDto> {
    if (user.id > 0) return this.keysService.signKey(dto, user.id);
    if (this.isKeyAccessAllowed(dto.publicKey, user.keys)) return this.keysService.signKey(dto);
    else throw new ForbiddenException('Sign operation is forbidden');
  }

  @AmqpSubscribe({
    exchange: 'amq.topic',
    routingKey: 'backend',
    queue: 'backend',
  })
  amqpSubscribe(@AmqpPayload() payload: AmqpPayloadDto): Promise<void> {
    if (payload.action === 'keygen_status') {
      return this.keysService.handleKeygenStatusUpdate(payload);
    }

    if (payload.action === 'sign_status') {
      return this.keysService.handleSignStatusUpdate(payload);
    }

    this.logger.warn('Unknown action', payload);
  }

  private isKeyAccessAllowed(requestedKey: string, userKeys: string[]): boolean {
    return userKeys && userKeys.findIndex((key) => key === requestedKey) !== -1;
  }
}
