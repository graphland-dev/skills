import { Injectable } from '@nestjs/common';

export interface SeatUsage {
  seatsUsed: number;
  pendingInvitesUsed: number;
}

/**
 * Counts org members + pending invites for seat-limit checks. Seats live in
 * your auth layer (e.g. Better Auth `member` / `invitation` collections), not
 * in the billing module — so wire this to read from there.
 *
 * The stub below returns a single owner seat. Replace the body with a real
 * query. Seat enforcement on invite/accept usually lives in auth hooks (which
 * can call canInviteMemberSeat/canAcceptMemberSeat from @app/plans) rather than
 * here, to avoid a circular dependency between auth and billing.
 */
@Injectable()
export class OrganizationSeatService {
  async getSeatUsage(_organizationId: string): Promise<SeatUsage> {
    // TODO: count auth members + pending invitations for the org.
    return { seatsUsed: 1, pendingInvitesUsed: 0 };
  }
}
