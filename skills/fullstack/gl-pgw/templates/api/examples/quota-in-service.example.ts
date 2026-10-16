/**
 * Quota enforcement patterns — copy the relevant method into the owning
 * service. Not a module; the model and DTO names are placeholders.
 */
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import {
  EntitlementService,
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from '@graphland/pgw-merchant/nest';
import { ConfigService } from '@nestjs/config';
import { APP_PGW_FEATURES } from '@app/feature-keys';
import { BillingProvisioningService } from '@/api/billing/billing-provisioning.service';

@Injectable()
export class QuotaExamples {
  private readonly clientId: string;

  constructor(
    private readonly entitlements: EntitlementService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly provisioning: BillingProvisioningService,
    @InjectModel('Product') private readonly products: Model<any>,
    @InjectModel('Member') private readonly members: Model<any>,
    @InjectModel('Order') private readonly orders: Model<any>,
    config: ConfigService,
  ) {
    this.clientId = config.getOrThrow<string>('PGW_CLIENT_ID');
  }

  /** non_consumable: "at most N products". Nothing is recorded — the count is the usage. */
  async createProduct(tenant: string, input: { handle: string }) {
    const currentQuantity = await this.products.countDocuments({
      tenant,
      deletedAt: null,
    });
    await this.entitlements.assertAndConsume({
      tenant,
      featureKey: APP_PGW_FEATURES.products,
      currentQuantity,
      requestId: `${this.clientId}:products:${tenant}:${input.handle}`,
    });
    return this.products.create({ ...input, tenant });
  }

  /** non_consumable keyed by a natural handle, so a retried invite dedupes. */
  async inviteMember(tenant: string, email: string) {
    const currentQuantity = await this.members.countDocuments({ tenant });
    await this.entitlements.assertAndConsume({
      tenant,
      featureKey: APP_PGW_FEATURES.staff,
      currentQuantity,
      requestId: `${this.clientId}:staff:${tenant}:${email.toLowerCase()}`,
    });
    return this.members.create({ tenant, email });
  }

  /**
   * consumable: one unit per order. Consumption is final, so call it
   * immediately before the insert. A random requestId is correct here because
   * every call is a new order.
   */
  async placeOrder(tenant: string, input: Record<string, unknown>) {
    await this.entitlements.assertAndConsume({
      tenant,
      featureKey: APP_PGW_FEATURES.orders,
      currentQuantity: 0,
      requestId: `${this.clientId}:orders:${tenant}:${randomUUID()}`,
    });
    return this.orders.create({ ...input, tenant });
  }

  /** consumable, quantity > 1 (e.g. AI tokens): check, then consume directly. */
  async consumeMany(tenant: string, quantity: number, requestId: string) {
    const entitlement = await this.gateway.getEntitlement(
      tenant,
      APP_PGW_FEATURES.orders,
    );
    const remaining = entitlement.remaining ?? 0;
    if (!entitlement.allowed || (remaining !== -1 && remaining < quantity)) {
      throw new Error('Plan limit reached');
    }
    await this.gateway.consume({
      billingCustomerId: tenant,
      featureKey: APP_PGW_FEATURES.orders,
      quantity,
      requestId,
    });
  }

  /** Tenant creation: provision billing after the tenant row exists. */
  async onTenantCreated(tenant: { uid: string; name: string }) {
    await this.provisioning.provision(tenant.uid, tenant.name);
  }
}
