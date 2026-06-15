import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { BillingFeatureKey } from './billing.contracts';
import { EntitlementService } from './entitlement.service';

export const REQUIRES_FEATURE_KEY = 'requiresFeature';

/**
 * Convenience decorator for endpoint-level feature gates:
 *
 *   @RequiresFeature('webhooks')
 *   @Post('webhooks')
 *   createWebhook(...) { ... }
 *
 * For quota/rate/limit checks that need request context (a count, the body),
 * call EntitlementService.assert* imperatively inside the service instead.
 */
export const RequiresFeature = (feature: BillingFeatureKey) =>
  SetMetadata(REQUIRES_FEATURE_KEY, feature);

/** Reads organizationId from the request (set by your auth guard). */
@Injectable()
export class RequiresFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<
      BillingFeatureKey | undefined
    >(REQUIRES_FEATURE_KEY, [context.getHandler(), context.getClass()]);

    if (!feature) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { organizationId?: string }>();
    const organizationId = request.organizationId;

    if (!organizationId) {
      return false;
    }

    // Throws BillingEntitlementException (403 FEATURE_NOT_AVAILABLE) when locked.
    await this.entitlementService.assertFeature(organizationId, feature);
    return true;
  }
}
