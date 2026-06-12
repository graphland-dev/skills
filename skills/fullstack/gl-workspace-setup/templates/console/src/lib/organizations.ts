import { auth } from "@/lib/auth";
import { apiRequest } from "@/lib/api-client";

export const organizationQueryKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationQueryKeys.all, "list"] as const,
};

export type AuthSessionData = NonNullable<
  Awaited<ReturnType<typeof auth.getSession>>["data"]
>;

export type CurrentOrganization = Awaited<
  ReturnType<typeof auth.organization.getFullOrganization>
>["data"];

export type UpdateOrganizationInput = {
  organizationId: string;
  name?: string;
  slug?: string;
};

export type CreateOrganizationInput = {
  name: string;
  slug?: string;
};

export type ResolveCurrentOrganizationResult = {
  organization: CurrentOrganization;
  didSetActiveOrganization: boolean;
};

export function getActiveOrganizationIdFromSession(
  session: AuthSessionData | null | undefined,
) {
  if (!session || !("session" in session)) {
    return null;
  }

  const activeOrganizationId = session.session?.activeOrganizationId;

  return typeof activeOrganizationId === "string" && activeOrganizationId
    ? activeOrganizationId
    : null;
}

async function getOrganizationById(organizationId: string) {
  const result = await auth.organization.getFullOrganization({
    query: { organizationId },
  });

  if (result.error) {
    return null;
  }

  return result.data ?? null;
}

export async function resolveCurrentOrganization(
  session: AuthSessionData,
): Promise<ResolveCurrentOrganizationResult> {
  const activeOrganizationId = getActiveOrganizationIdFromSession(session);

  if (activeOrganizationId) {
    const organization = await getOrganizationById(activeOrganizationId);

    if (organization) {
      return {
        organization,
        didSetActiveOrganization: false,
      };
    }
  }

  const organizations = await listOrganizations();
  const firstOrganization = organizations[0];

  if (!firstOrganization?.id) {
    return {
      organization: null,
      didSetActiveOrganization: false,
    };
  }

  await setActiveOrganization(firstOrganization.id);

  const organization =
    (await getOrganizationById(firstOrganization.id)) ?? firstOrganization;

  return {
    organization,
    didSetActiveOrganization: true,
  };
}

export function slugifyOrganizationName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listOrganizations() {
  const result = await auth.organization.list();

  if (result.error) {
    throw new Error(result.error.message ?? "Failed to load organizations");
  }

  return result.data ?? [];
}

export async function createOrganization(input: CreateOrganizationInput) {
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugifyOrganizationName(name)).trim();

  if (!name) {
    throw new Error("Organization name is required");
  }

  if (!slug) {
    throw new Error("Organization slug is required");
  }

  const result = await auth.organization.create({
    name,
    slug,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Failed to create organization");
  }

  return result.data;
}

export async function updateOrganization(input: UpdateOrganizationInput) {
  const data: { name?: string; slug?: string } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Organization name is required");
    }
    data.name = name;
  }

  if (input.slug !== undefined) {
    const slug = input.slug.trim();
    if (!slug) {
      throw new Error("Organization slug is required");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("Use lowercase letters, numbers, and hyphens only");
    }
    data.slug = slug;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Nothing to update");
  }

  const result = await auth.organization.update({
    organizationId: input.organizationId,
    data,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Failed to update organization");
  }

  return result.data;
}

export async function setActiveOrganization(organizationId: string) {
  const result = await auth.organization.setActive({ organizationId });

  if (result.error) {
    throw new Error(result.error.message ?? "Failed to switch organization");
  }

  return result.data;
}

export type OrganizationDeleteOtpResponse = {
  sent: boolean;
  maskedEmail: string;
  expiresInSeconds: number;
};

export async function requestOrganizationDeleteOtp(organizationId: string) {
  return apiRequest<OrganizationDeleteOtpResponse>(
    `/v1/organizations/${encodeURIComponent(organizationId)}/delete-otp`,
    { method: "POST" },
  );
}

export async function deleteOrganizationWithOtp(
  organizationId: string,
  otp: string,
) {
  return apiRequest<void>(
    `/v1/organizations/${encodeURIComponent(organizationId)}/delete`,
    {
      method: "POST",
      body: { otp },
    },
  );
}

export async function getActiveMemberRole() {
  const result = await auth.organization.getActiveMemberRole();

  if (result.error) {
    throw new Error(result.error.message ?? "Failed to load member role");
  }

  return result.data?.role ?? null;
}

export function getOrganizationInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
