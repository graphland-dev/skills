export type PrimaryOrgRole = "owner" | "admin" | "member";

export type ConsoleCapability =
  | "sessions:read"
  | "sessions:write"
  | "apiKeys:read"
  | "apiKeys:write"
  | "contacts:read"
  | "contacts:write"
  | "campaigns:read"
  | "campaigns:write"
  | "members:read"
  | "members:manage"
  | "invitations:manage"
  | "playground:use";

const ROLE_RANK: Record<PrimaryOrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

const CAPABILITY_MIN_ROLE: Record<ConsoleCapability, PrimaryOrgRole> = {
  "sessions:read": "member",
  "sessions:write": "member",
  "apiKeys:read": "member",
  "apiKeys:write": "member",
  "contacts:read": "member",
  "contacts:write": "member",
  "campaigns:read": "member",
  "campaigns:write": "member",
  "members:read": "member",
  "members:manage": "admin",
  "invitations:manage": "admin",
  "playground:use": "member",
};

export function parsePrimaryOrgRole(
  role: string | null | undefined,
): PrimaryOrgRole | null {
  if (!role) {
    return null;
  }

  const roles = role.split(",").map((value) => value.trim());

  if (roles.includes("owner")) {
    return "owner";
  }

  if (roles.includes("admin")) {
    return "admin";
  }

  if (roles.includes("member")) {
    return "member";
  }

  return null;
}

export function getOrgRoleLabel(role: PrimaryOrgRole | null) {
  if (!role) {
    return "Unknown";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function hasMinOrgRole(
  role: PrimaryOrgRole | null,
  minimumRole: PrimaryOrgRole,
) {
  if (!role) {
    return false;
  }

  return ROLE_RANK[role] >= ROLE_RANK[minimumRole];
}

export function canAccess(
  role: PrimaryOrgRole | null,
  capability: ConsoleCapability,
) {
  return hasMinOrgRole(role, CAPABILITY_MIN_ROLE[capability]);
}

export function canManageOrg(role: PrimaryOrgRole | null) {
  return hasMinOrgRole(role, "admin");
}

export function getLeaveOrganizationState(role: PrimaryOrgRole | null) {
  if (!role) {
    return {
      canLeave: false,
      blockedReason: "Could not determine your role in this organization.",
    };
  }

  if (role === "owner") {
    return {
      canLeave: false,
      blockedReason:
        "Transfer ownership to another member before leaving this organization.",
    };
  }

  return {
    canLeave: true,
    blockedReason: null,
  };
}

export function getDeleteOrganizationState(
  role: PrimaryOrgRole | null,
  organizationCount: number,
) {
  if (role !== "owner") {
    return {
      canDelete: false,
      showCard: false,
      blockedReason: null,
    };
  }

  if (organizationCount <= 1) {
    return {
      canDelete: false,
      showCard: true,
      blockedReason:
        "Create or join another organization before deleting this one.",
    };
  }

  return {
    canDelete: true,
    showCard: true,
    blockedReason: null,
  };
}
