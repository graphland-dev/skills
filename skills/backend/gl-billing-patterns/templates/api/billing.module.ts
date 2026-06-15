import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './entities/subscription.entity';
import {
  UsageCounter,
  UsageCounterSchema,
} from './entities/usage-counter.entity';
import {
  BillingInvoice,
  BillingInvoiceSchema,
} from './entities/billing-invoice.entity';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { SubscriptionRepositoryService } from './subscription.repository.service';
import { UsageCounterRepositoryService } from './usage-counter.repository.service';
import { BillingInvoiceRepositoryService } from './billing-invoice.repository.service';
import { SubscriptionService } from './subscription.service';
import { EntitlementService, USAGE_PROVIDER } from './entitlement.service';
import { OrganizationSeatService } from './organization-seat.service';
import { RateLimitService } from './rate-limit.service';
import { BillingService } from './billing.service';
import { BillingScheduler } from './billing.scheduler';
import { RequiresFeatureGuard } from './requires-feature.guard';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway.interface';
import { PgwGateway } from './gateway/pgw.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: UsageCounter.name, schema: UsageCounterSchema },
      { name: BillingInvoice.name, schema: BillingInvoiceSchema },
    ]),
  ],
  controllers: [BillingController, BillingWebhookController],
  providers: [
    SubscriptionRepositoryService,
    UsageCounterRepositoryService,
    BillingInvoiceRepositoryService,
    SubscriptionService,
    OrganizationSeatService,
    RateLimitService,
    EntitlementService,
    BillingService,
    BillingScheduler,
    RequiresFeatureGuard,
    // Swap PgwGateway for your provider's adapter (Stripe, Paddle, …).
    { provide: PAYMENT_GATEWAY, useClass: PgwGateway },
    // Provide a UsageProvider that counts your org-scoped resources.
    // Example:
    // {
    //   provide: USAGE_PROVIDER,
    //   useExisting: MyItemRepositoryService, // must implement countItems(orgId)
    // },
  ],
  exports: [EntitlementService, SubscriptionService, BillingService],
})
export class BillingModule {}
