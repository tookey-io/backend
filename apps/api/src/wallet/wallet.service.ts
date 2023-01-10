import { AppConfiguration } from 'apps/app/src/app.config';
import * as crypto from 'crypto';
import { EthersSigner, InjectSignerProvider, Wallet, getAddress } from 'nestjs-ethers';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletRepository } from '@tookey/database';

import { WalletEvent } from '../api.events';
import { WalletResponseDto } from './wallet.dto';
import { EncryptedKey } from './wallet.types';

@Injectable()
export class WalletService {
  constructor(
    private readonly wallet: WalletRepository,
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly eventEmitter: EventEmitter2,
    @InjectSignerProvider() private readonly ethersSigner: EthersSigner,
  ) {}

  async getAddress(userId: number): Promise<WalletResponseDto> {
    const wallet = await this.wallet.findOneBy({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const address = getAddress('0x' + wallet.address);
    return { address };
  }

  async createWallet(userId: number): Promise<WalletResponseDto> {
    const walletCount = await this.wallet.countBy({ userId });
    if (walletCount > 0) throw new BadRequestException('Wallet exist');
    const wallet: Wallet = this.ethersSigner.createRandomWallet();
    const walletSecret = this.getWalletSecret(userId);
    const encryptedKey = await this.encryptPrivateKey(wallet.privateKey, walletSecret);
    const address = await wallet.getAddress();

    await this.wallet.createOrUpdateOne({
      userId,
      address: address.replace('0x', '').toLowerCase(),
      ...encryptedKey,
    });

    this.eventEmitter.emit(WalletEvent.CREATE, userId, address);

    return { address };
  }

  private async encryptPrivateKey(privateKey: string, secret: string): Promise<EncryptedKey> {
    const salt = crypto.randomBytes(16);
    const key = await this.cipherKey(secret, salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  private async decryptPrivateKey(
    salt: string,
    iv: string,
    encryptedData: Buffer,
    tag: Buffer,
    secret: string,
  ): Promise<string> {
    const key = await this.cipherKey(secret, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString();
  }

  private async cipherKey(secret: crypto.BinaryLike, salt: crypto.BinaryLike): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(secret, salt, 100000, 32, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }

  private getWalletSecret(userId: number): string {
    const { secret } = this.configService.get('ethers', { infer: true });
    const hash = crypto.createHash('sha256');
    hash.update(`${userId}:${secret}`);
    return hash.digest('hex');
  }
}
