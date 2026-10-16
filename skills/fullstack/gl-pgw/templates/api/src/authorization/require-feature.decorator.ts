import { SetMetadata } from '@nestjs/common';
import type { AppPgwFeatureKey } from '@app/feature-keys';

export const REQUIRED_FEATURE = 'app:requiredFeature';

/**
 * Escape hatch for handlers the gate catalog can't name (REST controllers,
 * non-unique field names). GraphQL operations belong in `featureGateCatalog`.
 * Boolean features only.
 */
export const RequireFeature = (featureKey: AppPgwFeatureKey) =>
  SetMetadata(REQUIRED_FEATURE, featureKey);
