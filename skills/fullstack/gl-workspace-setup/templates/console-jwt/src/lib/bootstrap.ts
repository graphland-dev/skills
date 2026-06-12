import { fetchMe, fetchMyTenants } from "@/lib/identity";
import type { IRouteContext } from "@/lib/router-context";
import { TokenService } from "@/lib/token-service";

const ACTIVE_TENANT_KEY = "graphland:active-tenant-uid";

export function getActiveTenantUidFromPath() {
  const match = window.location.pathname.match(/^\/merchant\/([^/]+)/);
  return match?.[1] ?? null;
}

export function setActiveTenantUid(uid: string) {
  localStorage.setItem(ACTIVE_TENANT_KEY, uid);
}

export function getStoredActiveTenantUid() {
  return localStorage.getItem(ACTIVE_TENANT_KEY);
}

export const bootstrapQueryKey = ["bootstrap"] as const;

export const emptyRouterContext: IRouteContext = {
  session: null,
  currentOrganization: null,
  currentMemberRole: null,
};

export async function fetchBootstrap(): Promise<IRouteContext> {
  if (!TokenService.isAuthenticated()) {
    return emptyRouterContext;
  }

  const [me, tenants] = await Promise.all([fetchMe(), fetchMyTenants()]);
  const activeUid =
    getActiveTenantUidFromPath() ??
    getStoredActiveTenantUid() ??
    tenants[0]?.uid ??
    null;

  const currentTenant =
    tenants.find((tenant) => tenant.uid === activeUid) ?? tenants[0] ?? null;

  if (currentTenant) {
    setActiveTenantUid(currentTenant.uid);
  }

  return {
    session: {
      user: {
        name: me.name?.trim() || me.email,
        email: me.email,
        image: null,
      },
    },
    currentOrganization: currentTenant
      ? {
          id: currentTenant._id,
          name: currentTenant.name,
          uid: currentTenant.uid,
          logo: null,
        }
      : null,
    currentMemberRole: "owner",
  };
}
