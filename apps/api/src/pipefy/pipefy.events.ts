import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { UserEvent, WalletEvent } from '../api.events';
import { DiscordUserDto } from '../auth/providers/discord.dto';
import { UserDto } from '../user/user.dto';
import { PipefyService } from './pipefy.service';

@Injectable()
export class PipefyEventsHandler {
  constructor(private readonly pipefyService: PipefyService) {}

  @OnEvent(UserEvent.CREATE)
  async createUser(payload: UserDto): Promise<void> {
    await this.pipefyService.createCard({ userId: payload.id });
  }

  @OnEvent(UserEvent.CREATE_DISCORD)
  async createDiscordUser(payload: DiscordUserDto): Promise<void> {
    const cardId = await this.retry(() => this.pipefyService.getCardIdByUserId(payload.userId));
    if (!cardId) return;

    if (payload.email) {
      await this.pipefyService.updateCardField({ cardId, fieldId: 'email', value: payload.email });
    }
    if (payload.discordTag) {
      await this.pipefyService.updateCardField({ cardId, fieldId: 'discord', value: payload.discordTag });
    }
  }

  @OnEvent(WalletEvent.CREATE)
  async createWallet(userId: number, address: string): Promise<void> {
    const cardId = await this.retry(() => this.pipefyService.getCardIdByUserId(userId));
    if (!cardId) return;

    await this.pipefyService.updateCardField({ cardId, fieldId: 'internal_wallet', value: address });
  }

  private retry<T>(fn: () => Promise<T>, count = 100, timeout = 200): Promise<T> {
    return new Promise<T>(async (resolve) => {
      while (true) {
        const result: T = await fn();
        if (result) {
          resolve(result);
          break;
        } else {
          if (count <= 0) {
            resolve(null);
            break;
          }
          count -= 1;
          await this.wait(timeout);
        }
      }
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
