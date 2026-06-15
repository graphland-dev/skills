import { IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  BillingTermMonths,
  PaidPlanSlug,
  PlanFeatures,
  PlanLimits,
} from '@app/plans';
import { BILLING_TERM_MONTHS } from '@app/plans';
import { SubscriptionStatus } from '../billing.contracts';

export class CheckoutDto {
  @ApiProperty({ enum: ['free', 'pro', 'enterprise'] })
  @IsIn(['free', 'pro', 'enterprise'])
  planSlug: PaidPlanSlug;

  @ApiProperty({ enum: BILLING_TERM_MONTHS })
  @IsIn(BILLING_TERM_MONTHS)
  termMonths: BillingTermMonths;
}

export class UpdateSubscriptionDto {
  @ApiProperty()
  @IsBoolean()
  cancelAtPeriodEnd: boolean;
}

export class CheckoutResponseDto {
  @ApiProperty()
  paymentUrl: string;

  @ApiProperty()
  gatewayInvoiceId: string;
}

export class SubscriptionResponseDto {
  @ApiProperty()
  organizationId: string;

  @ApiProperty({ enum: ['free', 'pro', 'enterprise'] })
  planSlug: PaidPlanSlug;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiPropertyOptional({ nullable: true })
  trialEndsAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodStart: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd: string | null;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;
}

export class EntitlementsUsageDto {
  @ApiProperty()
  requestsUsed: number;

  @ApiProperty()
  itemsUsed: number;

  @ApiProperty()
  seatsUsed: number;

  @ApiProperty()
  pendingInvitesUsed: number;

  @ApiProperty()
  periodKey: string;
}

export class EntitlementsResponseDto {
  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ enum: ['free', 'pro', 'enterprise'] })
  planSlug: PaidPlanSlug;

  @ApiPropertyOptional({ nullable: true })
  trialEndsAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd: string | null;

  @ApiProperty()
  limits: PlanLimits;

  @ApiProperty()
  usage: EntitlementsUsageDto;

  @ApiProperty()
  features: PlanFeatures;
}
