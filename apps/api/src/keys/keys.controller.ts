import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AmqpPayload, AmqpSubscribe } from '@tookey/amqp';

import { ApiKeyGuard } from '../guards/apikey.guard';
import {
  AmqpPayloadDto,
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeyGetRequestDto,
  KeySignRequestDto,
  SignDto,
} from './keys.dto';
import { KeyService } from './keys.service';

@Controller('api/keys')
@ApiTags('keys')
// @UseGuards(ApiKeyGuard)
// @ApiSecurity('apiKey')
// @ApiUnauthorizedResponse()
@UseInterceptors(ClassSerializerInterceptor)
export class KeyController {
  private readonly logger = new Logger(KeyController.name);

  constructor(private readonly keysService: KeyService) {}

  @ApiOperation({ description: 'Create Key' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @Post()
  createKey(@Body() dto: KeyCreateRequestDto): Promise<KeyDto> {
    return this.keysService.create(dto);
  }

  @ApiOperation({ description: 'Get Key' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @Get()
  getKey(@Query() dto: KeyGetRequestDto): Promise<KeyDto> {
    return this.keysService.get(dto);
  }

  @ApiOperation({ description: 'Delete Key' })
  @ApiOkResponse({ type: KeyDeleteResponseDto })
  @Delete()
  deleteKey(@Body() dto: KeyDeleteRequestDto): Promise<KeyDeleteResponseDto> {
    return this.keysService.delete(dto);
  }

  @ApiOperation({ description: 'Sign Key' })
  @ApiOkResponse({ type: SignDto })
  @ApiNotFoundResponse()
  @Post('sign')
  sign(@Body() dto: KeySignRequestDto): Promise<SignDto> {
    return this.keysService.sign(dto);
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

    this.logger.log('Unknown action', JSON.stringify(payload, undefined, 2));
  }
}
