import { GraphQLClient } from 'graphql-request';

import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { Injectable } from '@nestjs/common';
import { PipefyRepository } from '@tookey/database';

import { AOFG_CUSTOMER_PIPE_ID } from './pipefy.constants';
import { PipefyCardDto, PipefyCreateCardDto, PipefyUpdateCardFieldDto } from './pipefy.dto';
import { PipefyCreateCardInput, PipefyUpdateCardFieldInput } from './pipefy.inputs';
import { createCardOperation, updateCardFieldOperation } from './pipefy.operations';

@Injectable()
export class PipefyService {
  constructor(
    private readonly pipefy: PipefyRepository,
    @InjectGraphQLClient() private readonly client: GraphQLClient,
  ) {}

  async createCard(dto: PipefyCreateCardDto): Promise<PipefyCardDto> {
    const input: PipefyCreateCardInput = {
      pipe_id: AOFG_CUSTOMER_PIPE_ID,
      title: `User #${dto.userId}`,
    };
    if (dto.email || dto.discord) {
      input.fields_attributes = [];
      if (dto.email) input.fields_attributes.push({ field_id: 'email', field_value: dto.email });
      if (dto.discord) input.fields_attributes.push({ field_id: 'discord', field_value: dto.discord });
    }

    type TData = { createCard: { card: PipefyCardDto } };
    const result = await this.client.request<TData>(createCardOperation, { input });

    await this.pipefy.createOrUpdateOne({
      userId: dto.userId,
      pipeId: AOFG_CUSTOMER_PIPE_ID,
      cardId: result.createCard.card.id,
    });

    return result.createCard.card;
  }

  async getCardIdByUserId(userId: number): Promise<string | null> {
    const pipe = await this.pipefy.findOneBy({ userId, pipeId: AOFG_CUSTOMER_PIPE_ID });
    if (!pipe) return null;
    return pipe.cardId;
  }

  async updateCardField(dto: PipefyUpdateCardFieldDto): Promise<PipefyCardDto> {
    const input: PipefyUpdateCardFieldInput = {
      card_id: dto.cardId,
      field_id: dto.fieldId,
      new_value: dto.value,
    };

    type TData = { updateCardField: { card: PipefyCardDto } };
    const result = await this.client.request<TData>(updateCardFieldOperation, { input });
    return result.updateCardField.card;
  }
}
