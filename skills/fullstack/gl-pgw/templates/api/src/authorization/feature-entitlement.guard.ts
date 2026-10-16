import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { getRequiredFeature } from '@app/feature-keys';
import { FeatureEntitlementService } from '@/api/billing/feature-entitlement.service';
import { REQUIRED_FEATURE } from './require-feature.decorator';

/**
 * Global guard for boolean plan features. The required key comes from
 * `@RequireFeature` metadata, else from the shared gate catalog by GraphQL
 * field name. Ungated operations pass without a PGW call.
 */
@Injectable()
export class FeatureEntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly features: FeatureEntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext =
      context.getType<string>() === 'graphql'
        ? GqlExecutionContext.create(context)
        : undefined;

    const featureKey =
      this.reflector.get<string>(REQUIRED_FEATURE, context.getHandler()) ??
      getRequiredFeature(gqlContext?.getInfo()?.fieldName);

    if (!featureKey) return true;

    const request = gqlContext
      ? gqlContext.getContext().req
      : context.switchToHttp().getRequest();
    const tenant = request?.headers?.['x-tenant'] as string | undefined;

    if (!tenant) {
      throw new ForbiddenException(
        'Missing tenant context for a plan-gated operation',
      );
    }

    await this.features.assertFeatureAllowed(tenant, featureKey);
    return true;
  }
}
