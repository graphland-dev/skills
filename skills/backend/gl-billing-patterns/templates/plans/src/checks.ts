import type {
  OrgEntitlements,
  PlanLimits,
  SubscriptionStatus,
} from './types.js';

/** Only trialing and active orgs may perform metered/gated actions. */
export function canUseService(status: SubscriptionStatus): boolean {
  return status === 'trialing' || status === 'active';
}

export function hasBillingFeature(
  entitlements: OrgEntitlements | undefined,
  feature: keyof OrgEntitlements['features'],
): boolean {
  return Boolean(entitlements?.features[feature]);
}

export function getSeatSlotsUsed(
  entitlements: OrgEntitlements | undefined,
): number {
  if (!entitlements) {
    return 0;
  }
  return entitlements.usage.seatsUsed + entitlements.usage.pendingInvitesUsed;
}

export function canInviteMemberSeat(
  seatsUsed: number,
  maxSeats: number | null,
): boolean {
  if (maxSeats == null) {
    return true;
  }
  return seatsUsed + 1 <= maxSeats;
}

export function canInviteOrgMember(
  entitlements: OrgEntitlements | undefined,
): boolean {
  return canInviteMemberSeat(
    getSeatSlotsUsed(entitlements),
    entitlements?.limits.maxSeats ?? null,
  );
}

export function canAcceptMemberSeat(
  seatsUsed: number,
  maxSeats: number | null,
): boolean {
  if (maxSeats == null) {
    return true;
  }
  return seatsUsed < maxSeats;
}

/** Volume cap for the current period (null = unlimited). */
export function isRequestQuotaExceeded(
  limits: PlanLimits,
  requestsUsed: number,
): boolean {
  if (limits.maxRequestsPerPeriod == null) {
    return false;
  }
  return requestsUsed >= limits.maxRequestsPerPeriod;
}

/** Resource cap, e.g. items/projects/connections (null = unlimited). */
export function isItemLimitExceeded(
  limits: PlanLimits,
  itemsUsed: number,
): boolean {
  if (limits.maxItems == null) {
    return false;
  }
  return itemsUsed >= limits.maxItems;
}
