import { AppConfiguration } from 'apps/app/src/app.config';
import * as crypto from 'crypto';
import { addMinutes } from 'date-fns';
import { Signature, utils } from 'ethers';
import { EthersSigner, InjectSignerProvider, Wallet, getAddress } from 'nestjs-ethers';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { MessageTypes, SignTypedDataVersion, TypedMessage, signTypedData } from '@metamask/eth-sig-util';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletRepository } from '@tookey/database';

import { WalletEvent } from '../api.events';
import { KeysService } from '../keys/keys.service';
import { WalletResponseDto, WalletSignCallPermitDto, WalletTssSignRequestDto } from './wallet.dto';
import { EncryptedKey } from './wallet.types';

@Injectable()
export class WalletService {
  constructor(
    @InjectPinoLogger(WalletService.name) private readonly logger: PinoLogger,
    private readonly wallet: WalletRepository,
    private readonly configService: ConfigService<AppConfiguration>,
    private readonly eventEmitter: EventEmitter2,
    private readonly keysService: KeysService,
    @InjectSignerProvider() private readonly ethersSigner: EthersSigner,
  ) {}

  async getAddress(userId: number): Promise<WalletResponseDto> {
    const wallet = await this.wallet.findOneBy({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');
    const address = getAddress('0x' + wallet.address);
    return { address };
  }

  async createWalletTss(roomId: string, userId: number): Promise<any> {
    const key = await this.keysService.createKey(
      {
        participantsCount: 2,
        participantsThreshold: 2,
        timeoutSeconds: 60,
      },
      userId,
      roomId,
    );

    return { key };
  }

  async joinWalletTss(roomId: string, userId: number): Promise<any> {
    const key = await this.keysService.createKey(
      {
        participantIndex: 2,
        participantsCount: 2,
        participantsThreshold: 2,
        timeoutSeconds: 60,
      },
      userId,
      roomId,
    );

    return { key };
  }

  async signTSS(dto: WalletTssSignRequestDto, userId: number): Promise<any> {
    const key = await this.keysService.signKey(
      {
        data: dto.data,
        publicKey: dto.publicKey,
        metadata: {},
        participantsConfirmations: [1, 2],
      },
      userId,
      dto.roomId,
    );

    return { key };
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

  async callPermit(userId: number, query: WalletSignCallPermitDto): Promise<Signature> {
    const wallet = await this.wallet.findOneBy({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const from = getAddress('0x' + wallet.address);

    const message = {
      from,
      to: '0x08Ae35821e40E715271F73f3E6566db8E6190218',
      value: '0',
      gaslimit: '3000000',
      nonce: '1',
      deadline: query.deadline.toString() || addMinutes(new Date(), 5).getTime().toString(),
      data: query.message,
    };

    const typedData = this.createPermitMessageTypedData(message);
    const walletSecret = this.getWalletSecret(userId);
    const privateKey = await this.decryptPrivateKey(
      wallet.salt,
      wallet.iv,
      wallet.encryptedData,
      wallet.tag,
      walletSecret,
    );

    const signature = signTypedData({
      privateKey: Buffer.from(privateKey.toString().replace('0x', ''), 'hex'),
      data: typedData,
      version: SignTypedDataVersion.V4,
    });

    this.logger.info(`Transaction successful with hash: ${signature}`);

    return utils.splitSignature(signature);
  }

  createPermitMessageTypedData(message: Record<string, unknown>): TypedMessage<MessageTypes> {
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        CallPermit: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'gaslimit', type: 'uint64' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'CallPermit',
      domain: {
        name: 'Call Permit Precompile',
        version: '1',
        chainId: 1287,
        verifyingContract: '0x000000000000000000000000000000000000080a',
      },
      message: message,
    };

    return typedData;
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
    encryptedData: string,
    tag: string,
    secret: string,
  ): Promise<Buffer> {
    const key = await this.cipherKey(secret, Buffer.from(salt, 'hex'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
    return decrypted;
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
