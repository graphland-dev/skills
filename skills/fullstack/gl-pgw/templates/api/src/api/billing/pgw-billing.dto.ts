import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreatePgwCheckoutInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  planKey: string;

  /** PGW price variant key (e.g. "30d", "365d") exactly as selected in the UI. */
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  variantKey: string;
}

@InputType()
export class PayPgwInvoiceInput {
  /** PGW invoice UID (`pendingInvoice.invoiceNumber` / `invoice.invoiceUID`). */
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;
}

@ObjectType()
export class PgwCheckoutSessionResponseDto {
  @Field(() => String)
  sessionId: string;

  /** Hosted checkout URL. Empty when a free variant activated immediately. */
  @Field(() => String, { nullable: true })
  redirectUrl?: string | null;

  @Field(() => String)
  invoiceId: string;
}
