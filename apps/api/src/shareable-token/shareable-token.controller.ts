import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { ShareableTokenCreateRequestDto, ShareableTokenDto } from './shareable-token.dto';
import { ShareableTokenService } from './shareable-token.service';

@Controller('api/shareable-tokens')
@ApiTags('Shareable Tokens')
@UseInterceptors(ClassSerializerInterceptor)
export class ShareableTokenController {
  constructor(private readonly shareableTokenService: ShareableTokenService) {}

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

  @JwtAuth()
  @ApiOperation({ description: 'Get Shareable Tokens by User' })
  @ApiOkResponse({ type: ShareableTokenDto })
  @Get('my')
  async getShareableTokensByUser(@CurrentUser() user: UserContextDto): Promise<ShareableTokenDto[]> {
    return await this.shareableTokenService.getShareableTokensByUser(user.id);
  }
}
