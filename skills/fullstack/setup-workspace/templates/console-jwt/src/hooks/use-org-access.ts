import useAppContext from "@/hooks/useAppContext";
import {
  canAccess,
  canManageOrg,
  getOrgRoleLabel,
  parsePrimaryOrgRole,
  type ConsoleCapability,
  type PrimaryOrgRole,
} from "@/lib/org-access";

export function useOrgAccess() {
  const { currentMemberRole: rawRole } = useAppContext();
  const role = parsePrimaryOrgRole(rawRole);

  return {
    role,
    rawRole,
    roleLabel: getOrgRoleLabel(role),
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isMember: role === "member",
    canManageOrg: canManageOrg(role),
    can: (capability: ConsoleCapability) => canAccess(role, capability),
  };
}

export type UseOrgAccessResult = ReturnType<typeof useOrgAccess> & {
  role: PrimaryOrgRole | null;
};
