export const AUTH_COLLECTIONS = {
  user: 'auth__Users',
  session: 'auth__Sessions',
  account: 'auth__Accounts',
  verification: 'auth__Verifications',
  rateLimit: 'auth__RateLimits',
  organization: 'auth__Organizations',
  member: 'auth__Members',
  invitation: 'auth__Invitations',
  team: 'auth__Teams',
  teamMember: 'auth__TeamMembers',
  organizationRole: 'auth__OrganizationRoles',
} as const;

/** Core Better Auth models — spread into betterAuth({ ... }) */
export const CORE_AUTH_MODEL_OPTIONS = {
  user: { modelName: AUTH_COLLECTIONS.user },
  session: { modelName: AUTH_COLLECTIONS.session },
  account: { modelName: AUTH_COLLECTIONS.account },
  verification: { modelName: AUTH_COLLECTIONS.verification },
  rateLimit: { modelName: AUTH_COLLECTIONS.rateLimit },
} as const;

export const ORGANIZATION_AUTH_SCHEMA = {
  organization: { modelName: AUTH_COLLECTIONS.organization },
  member: { modelName: AUTH_COLLECTIONS.member },
  invitation: { modelName: AUTH_COLLECTIONS.invitation },
  team: { modelName: AUTH_COLLECTIONS.team },
  teamMember: { modelName: AUTH_COLLECTIONS.teamMember },
  organizationRole: { modelName: AUTH_COLLECTIONS.organizationRole },
} as const;
