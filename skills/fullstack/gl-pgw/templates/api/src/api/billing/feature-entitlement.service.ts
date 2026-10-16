import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from '@graphland/pgw-merchant/nest';

/**
 * Enforces boolean (on/off) plan features. The SDK's
 * `EntitlementService.assertAndConsume` throws for boolean features, so flags
 * are checked here via `getEntitlement().allowed`.
 */
@Injectable()
export class FeatureEntitlementService {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async isFeatureAllowed(tenant: string, featureKey: string): Promise<boolean> {
    const entitlement = await this.gateway.getEntitlement(tenant, featureKey);
    return entitlement.allowed === true;
  }

  async assertFeatureAllowed(
    tenant: string,
    featureKey: string,
  ): Promise<void> {
    if (!(await this.isFeatureAllowed(tenant, featureKey))) {
      throw new ForbiddenException(
        'Your current plan does not include this feature',
      );
    }
  }
}
