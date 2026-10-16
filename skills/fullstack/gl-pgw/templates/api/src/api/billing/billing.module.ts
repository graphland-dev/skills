import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FeatureEntitlementGuard } from '@/authorization/feature-entitlement.guard';
import { BillingProvisioningService } from './billing-provisioning.service';
import { FeatureEntitlementService } from './feature-entitlement.service';
import { PgwBillingResolver } from './pgw-billing.resolver';
import { PgwCheckoutService } from './pgw-checkout.service';

/**
 * Requires PgwBillingModule (src/config/pgw.config.ts) in AppModule — it is
 * global and provides PAYMENT_GATEWAY / EntitlementService to every module.
 */
@Module({
  providers: [
    PgwCheckoutService,
    PgwBillingResolver,
    FeatureEntitlementService,
    BillingProvisioningService,
    { provide: APP_GUARD, useClass: FeatureEntitlementGuard },
  ],
  exports: [FeatureEntitlementService, BillingProvisioningService],
})
export class BillingModule {}
