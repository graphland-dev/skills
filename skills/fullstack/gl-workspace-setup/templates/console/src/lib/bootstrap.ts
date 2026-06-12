import { auth } from "@/lib/auth";
import {
  getActiveMemberRole,
  getActiveOrganizationIdFromSession,
  resolveCurrentOrganization,
  type AuthSessionData,
  type CurrentOrganization,
} from "@/lib/organizations";

export const bootstrapQueryKey = ["bootstrap"] as const;

export type BootstrapData = {
  session: AuthSessionData | null;
  currentOrganization: CurrentOrganization;
  currentMemberRole: string | null;
};

export async function fetchBootstrap(): Promise<BootstrapData> {
  const sessionResult = await auth.getSession();

  if (sessionResult.error) {
    throw new Error(sessionResult.error.message ?? "Failed to load session");
  }

  if (!sessionResult.data) {
    return {
      session: null,
      currentOrganization: null,
      currentMemberRole: null,
    };
  }

  const { organization, didSetActiveOrganization } =
    await resolveCurrentOrganization(sessionResult.data);

  let session = sessionResult.data;

  if (
    didSetActiveOrganization ||
    (organization && !getActiveOrganizationIdFromSession(session))
  ) {
    const refreshedSession = await auth.getSession();

    if (refreshedSession.error) {
      throw new Error(
        refreshedSession.error.message ?? "Failed to refresh session",
      );
    }

    session = refreshedSession.data ?? session;
  }

  let currentMemberRole: string | null = null;

  if (organization) {
    currentMemberRole = await getActiveMemberRole();
  }

  return {
    session,
    currentOrganization: organization,
    currentMemberRole,
  };
}
