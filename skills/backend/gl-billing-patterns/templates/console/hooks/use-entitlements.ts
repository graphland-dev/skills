import { useQuery } from '@tanstack/react-query';
// Your app's way of getting the active org id (router context, auth store, …).
import { useActiveOrganizationId } from '@/hooks/use-active-organization';
import {
  billingQueryKeys,
  canInviteOrgMember,
  getEntitlements,
  getFeatureLockMessage,
  getMemberLimitMessage,
  hasBillingFeature,
  type BillingFeatureKey,
  type OrgEntitlements,
} from '@/lib/billing';

export type UseEntitlementsResult = {
  entitlements: OrgEntitlements | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  hasFeature: (feature: BillingFeatureKey) => boolean;
  canInviteMember: () => boolean;
  getMemberLimitMessage: () => string | null;
  getLockMessage: (feature: BillingFeatureKey) => string;
};

/**
 * Single source of entitlement state for the UI. Load it once in the merchant
 * layout; React Query dedupes the rest. The server is authoritative — these
 * values only drive lock icons and upgrade prompts.
 */
export function useEntitlements(): UseEntitlementsResult {
  const organizationId = useActiveOrganizationId();

  const query = useQuery({
    queryKey: billingQueryKeys.entitlements(organizationId),
    queryFn: getEntitlements,
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  });

  const entitlements = query.data;

  return {
    entitlements,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    hasFeature: (feature) => hasBillingFeature(entitlements, feature),
    canInviteMember: () => canInviteOrgMember(entitlements),
    getMemberLimitMessage: () => getMemberLimitMessage(entitlements),
    getLockMessage: (feature) => getFeatureLockMessage(entitlements, feature),
  };
}
