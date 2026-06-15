import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
// From gl-api-patterns common foundation. Add your auth guard at the class level.
import { OrganizationId } from '@/common/decorators/organization-id.decorator';
import {
  CheckoutDto,
  CheckoutResponseDto,
  EntitlementsResponseDto,
  UpdateSubscriptionDto,
} from './dto/billing.dto';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { SubscriptionService } from './subscription.service';
import { BillingInvoiceRepositoryService } from './billing-invoice.repository.service';

@ApiTags('Billing')
@Controller('v1/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly entitlementService: EntitlementService,
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceRepository: BillingInvoiceRepositoryService,
  ) {}

  @Get('entitlements')
  @ApiOperation({ summary: 'Resolved limits, features, and usage' })
  getEntitlements(
    @OrganizationId() organizationId: string,
  ): Promise<EntitlementsResponseDto> {
    return this.entitlementService.getEntitlements(organizationId);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Current subscription' })
  async getSubscription(@OrganizationId() organizationId: string) {
    const sub =
      await this.subscriptionService.ensureSubscription(organizationId);
    return {
      organizationId: sub.organizationId,
      planSlug: sub.planSlug,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create a checkout invoice; returns payment URL' })
  createCheckout(
    @OrganizationId() organizationId: string,
    @Body() input: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.billingService.createCheckout(
      organizationId,
      input.planSlug,
      input.termMonths,
      { id: organizationId },
    );
  }

  @Patch('subscription')
  @ApiOperation({ summary: 'Cancel at period end (or re-enable auto-renew)' })
  async updateSubscription(
    @OrganizationId() organizationId: string,
    @Body() input: UpdateSubscriptionDto,
  ) {
    await this.subscriptionService.updateByOrganizationId(organizationId, {
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    });
    return this.getSubscription(organizationId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Invoice history' })
  async listInvoices(@OrganizationId() organizationId: string) {
    const invoices =
      await this.invoiceRepository.listByOrganization(organizationId);
    return invoices.map((inv) => ({
      id: inv._id.toString(),
      identifier: inv.identifier,
      planSlug: inv.planSlug,
      termMonths: inv.termMonths,
      amount: inv.amount ?? 0,
      currency: inv.currency,
      status: inv.status,
      purpose: inv.purpose,
      paidAt: inv.paidAt?.toISOString() ?? null,
      createdAt: (inv.createdAt as Date).toISOString(),
    }));
  }

  @Post('invoices/:id/pay')
  @ApiOperation({ summary: 'Resume payment for a pending invoice' })
  async payInvoice(
    @OrganizationId() _organizationId: string,
    @Param('id') _id: string,
  ): Promise<CheckoutResponseDto> {
    // Implement: look up the pending invoice and re-create its gateway checkout.
    throw new Error('Not implemented');
  }
}
