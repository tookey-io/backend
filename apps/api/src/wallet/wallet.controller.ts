import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { WalletResponseDto } from './wallet.dto';
import { WalletService } from './wallet.service';

@Controller('api/wallet')
@ApiTags('Wallet')
@UseInterceptors(ClassSerializerInterceptor)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @JwtAuth()
  @ApiOperation({ description: 'Create Custody Wallet' })
  @ApiOkResponse({ type: WalletResponseDto })
  @Get()
  async getWallet(@CurrentUser() user: UserContextDto): Promise<WalletResponseDto> {
    return await this.walletService.getAddress(user.id);
  }
}
