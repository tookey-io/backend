import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
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
  amqpSubscribe(@AmqpPayload() payload: AmqpPayloadDto): void {
    this.keysService.amqpSubscribe(payload);
  }
}
