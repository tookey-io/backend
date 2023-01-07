export class PipefyCardDto {
  id: string;
}

export class PipefyCreateCardDto {
  userId: number;
  email?: string;
  discord?: string;
}

export class PipefyUpdateCardFieldDto {
  cardId: string;
  fieldId?: string;
  value?: any;
}
