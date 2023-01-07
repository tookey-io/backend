import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { Field, InputType } from '@nestjs/graphql';

@InputType()
class FieldValueInput {
  @Field()
  @IsString()
  field_id: string;

  @Field()
  field_value: any;
}

@InputType()
export class PipefyCreateCardInput {
  @Field()
  @IsOptional()
  @IsString()
  public clientMutationId?: string;

  @Field()
  @IsOptional()
  @IsNumber()
  public pipe_id?: number;

  @Field()
  @IsOptional()
  @IsNumber(null, { each: true })
  public assignee_ids?: number[];

  @Field()
  @IsOptional()
  @IsString({ each: true })
  public attachments?: string[];

  @Field()
  @IsOptional()
  @IsString()
  public due_date?: string;

  @Field()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FieldValueInput)
  fields_attributes?: FieldValueInput[];

  @Field()
  @IsOptional()
  @IsNumber(null, { each: true })
  public label_ids?: number[];

  @Field()
  @IsOptional()
  @IsNumber(null, { each: true })
  public parent_ids?: number[];

  @Field()
  @IsOptional()
  @IsNumber()
  public phase_id?: number;

  @Field()
  @IsOptional()
  @IsString()
  public title?: string;
}

@InputType()
export class PipefyUpdateCardFieldInput {
  @Field()
  @IsOptional()
  @IsString()
  public clientMutationId?: string;

  @Field()
  @IsOptional()
  @IsString()
  public card_id?: string;

  @Field()
  @IsOptional()
  @IsString()
  public field_id?: string;

  @Field()
  @IsOptional()
  public new_value?: any;
}
