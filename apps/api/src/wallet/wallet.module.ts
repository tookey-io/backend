import { AppConfiguration } from 'apps/app/src/app.config';
import { EthersModule } from 'nestjs-ethers';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmExModule, WalletRepository } from '@tookey/database';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

const WalletRepositories = TypeOrmExModule.forCustomRepository([WalletRepository]);

@Module({
  imports: [
    WalletRepositories,
    EthersModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration>) => {
        const { network } = config.get('ethers', { infer: true });
        return { network };
      },
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService, WalletRepositories],
})
export class WalletModule {}
