import { useEntitlements } from '@/hooks/use-entitlements';
import type { BillingFeatureKey } from '@/lib/billing';

export type UseFeatureGateResult = {
  locked: boolean;
  isLoading: boolean;
  lockMessage: string;
  hasFeature: boolean;
};

/** Per-feature gate state for a single UI element. */
export function useFeatureGate(
  feature: BillingFeatureKey,
): UseFeatureGateResult {
  const { hasFeature, isLoading, getLockMessage } = useEntitlements();
  const enabled = hasFeature(feature);

  return {
    locked: !isLoading && !enabled,
    isLoading,
    lockMessage: getLockMessage(feature),
    hasFeature: enabled,
  };
}
