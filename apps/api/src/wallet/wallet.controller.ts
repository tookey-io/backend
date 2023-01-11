import { Signature } from 'ethers';

import { Body, ClassSerializerInterceptor, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { WalletResponseDto, WalletSignCallPermitDto } from './wallet.dto';
import { WalletService } from './wallet.service';

@Controller('api/wallet')
@ApiTags('Wallet')
@UseInterceptors(ClassSerializerInterceptor)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @JwtAuth()
  @ApiOperation({ description: 'Create Custody Wallet' })
  @ApiOkResponse({ type: WalletResponseDto })
  @Post()
  async createWallet(@CurrentUser() user: UserContextDto): Promise<WalletResponseDto> {
    return await this.walletService.createWallet(user.id);
  }

  @JwtAuth()
  @ApiOperation({ description: 'Get Custody Wallet' })
  @ApiOkResponse({ type: WalletResponseDto })
  @Get()
  async getWallet(@CurrentUser() user: UserContextDto): Promise<WalletResponseDto> {
    return await this.walletService.getAddress(user.id);
  }

  @JwtAuth()
  @ApiOperation({ description: 'Sign Call Permit' })
  @ApiOkResponse({ type: WalletResponseDto })
  @Post('callpermit')
  async callPermit(@CurrentUser() user: UserContextDto, @Body() body: WalletSignCallPermitDto): Promise<Signature> {
    return await this.walletService.callPermit(user.id, body);
  }
}
