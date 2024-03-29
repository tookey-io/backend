import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import {
  ShareableTokenCreateRequestDto,
  ShareableTokenDeleteRequestDto,
  ShareableTokenDeleteResponseDto,
  ShareableTokenDto,
} from './shareable-token.dto';
import { ShareableTokenService } from './shareable-token.service';
import { AnyRoles } from '../decorators/any-role.decorator';

@Controller('api/shareable-tokens')
@ApiTags('Shareable Tokens')
@UseInterceptors(ClassSerializerInterceptor)
export class ShareableTokenController {
  constructor(private readonly shareableTokenService: ShareableTokenService) {}

  @AnyRoles('user.tokens.write')
  @JwtAuth()
  @ApiOperation({ description: 'Create Shareable Token' })
  @ApiOkResponse({ type: ShareableTokenDto })
  @ApiBadRequestResponse({ description: 'Provided keys not found' })
  @HttpCode(200)
  @Post()
  async createShareableToken(
    @CurrentUser() user: UserContextDto,
    @Body() dto: ShareableTokenCreateRequestDto,
  ): Promise<ShareableTokenDto> {
    return await this.shareableTokenService.createShareableToken(user.id, dto);
  }

  @AnyRoles('user.tokens.read')
  @JwtAuth()
  @ApiOperation({ description: 'Get Shareable Tokens by User' })
  @ApiOkResponse({ type: ShareableTokenDto, isArray: true })
  @Get('my')
  async getShareableTokensByUser(@CurrentUser() user: UserContextDto): Promise<ShareableTokenDto[]> {
    return await this.shareableTokenService.getShareableTokensByUser(user.id);
  }

  @AnyRoles('user.tokens.write')
  @JwtAuth()
  @ApiOperation({ description: 'Delete Shareable Token' })
  @ApiOkResponse({ type: ShareableTokenDeleteResponseDto })
  @Delete()
  deleteShareableToken(
    @Body() dto: ShareableTokenDeleteRequestDto,
    @CurrentUser() user: UserContextDto,
  ): Promise<ShareableTokenDeleteResponseDto> {
    return this.shareableTokenService.delete(dto, user.id);
  }
}
