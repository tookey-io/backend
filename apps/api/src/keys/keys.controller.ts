import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Logger,
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

import { Auth } from '../decorators/auth.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserContextDto } from '../user/user.dto';
import {
  AmqpPayloadDto,
  KeyCreateRequestDto,
  KeyDeleteRequestDto,
  KeyDeleteResponseDto,
  KeyDto,
  KeySignRequestDto,
  SignDto,
} from './keys.dto';
import { KeyService } from './keys.service';

@Controller('api/keys')
@ApiTags('keys')
@Auth()
@UseInterceptors(ClassSerializerInterceptor)
export class KeyController {
  private readonly logger = new Logger(KeyController.name);

  constructor(private readonly keysService: KeyService) {}

  @ApiOperation({ description: 'Create a Key' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @ApiRequestTimeoutResponse()
  @ApiInternalServerErrorResponse()
  @Post()
  createKey(
    @Body() dto: KeyCreateRequestDto,
    @CurrentUser() user: UserContextDto,
  ): Promise<KeyDto> {
    return this.keysService.createKey(dto, user.id);
  }

  @ApiOperation({ description: 'Get a Key' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @Get(':id')
  getKey(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserContextDto,
  ): Promise<KeyDto> {
    return this.keysService.getKey({ id }, user.id);
  }

  @ApiOperation({ description: 'Get Keys' })
  @ApiOkResponse({ type: KeyDto })
  @ApiNotFoundResponse()
  @Get()
  getKeys(@CurrentUser() user: UserContextDto): Promise<KeyDto[]> {
    return this.keysService.getKeys(user.id);
  }

  @ApiOperation({ description: 'Delete a Key' })
  @ApiOkResponse({ type: KeyDeleteResponseDto })
  @Delete()
  deleteKey(
    @Body() dto: KeyDeleteRequestDto,
    @CurrentUser() user: UserContextDto,
  ): Promise<KeyDeleteResponseDto> {
    return this.keysService.delete(dto, user.id);
  }

  @ApiOperation({ description: 'Sign a Key' })
  @ApiOkResponse({ type: SignDto })
  @ApiNotFoundResponse()
  @Post('sign')
  signKey(
    @Body() dto: KeySignRequestDto,
    @CurrentUser() user: UserContextDto,
  ): Promise<SignDto> {
    return this.keysService.signKey(dto, user.id);
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
