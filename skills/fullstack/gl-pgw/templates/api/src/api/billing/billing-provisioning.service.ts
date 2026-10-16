import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphlandPGWClient } from '@graphland/pgw-merchant';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from '@graphland/pgw-merchant/nest';

/**
 * Creates the PGW customer + free baseline subscription for a new tenant.
 * Best-effort: signup must not fail because PGW is unreachable. A tenant whose
 * provisioning failed lands on "choose a plan", and checkout provisions it.
 */
@Injectable()
export class BillingProvisioningService {
  private readonly logger = new Logger(BillingProvisioningService.name);
  private readonly client: GraphlandPGWClient;
  private readonly clientId: string;

  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    config: ConfigService,
  ) {
    this.clientId = config.getOrThrow<string>('PGW_CLIENT_ID');
    this.client = new GraphlandPGWClient({
      apiKey: config.getOrThrow<string>('PGW_API_KEY'),
      clientId: this.clientId,
      baseUrl: config.get<string>('PGW_BASE_URL'),
    });
  }

  /** Call right after the tenant is persisted. `tenantUid` is the billingCustomerId. */
  async provision(tenantUid: string, displayName: string): Promise<void> {
    await Promise.all([
      this.gateway
        .ensureBillingAccount?.(tenantUid)
        .catch((error: Error) =>
          this.logger.error(
            `PGW billing account provisioning failed for ${tenantUid}: ${error.message}`,
          ),
        ),
      this.client
        .ensureCustomer(
          tenantUid,
          { displayMetadata: { name: displayName } },
          `${this.clientId}:customer:${tenantUid}:display-name`,
        )
        .catch((error: Error) =>
          this.logger.warn(
            `PGW customer display name sync failed for ${tenantUid}: ${error.message}`,
          ),
        ),
    ]);
  }
}
