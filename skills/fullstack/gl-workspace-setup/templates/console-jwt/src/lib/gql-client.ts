import { env } from "@/lib/env";
import { TokenService } from "@/lib/token-service";

function getCurrentTenantFromPath(): string | null {
  const match = window.location.pathname.match(/^\/merchant\/([^/]+)/);
  return match?.[1] ?? null;
}

export async function gqlRequest<T>(payload: {
  query: string;
  variables?: Record<string, unknown>;
  tenant?: string;
}): Promise<T> {
  const token = TokenService.getToken();
  const urlTenant = getCurrentTenantFromPath();
  const effectiveTenant = payload.tenant ?? urlTenant ?? undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (effectiveTenant) {
    headers["x-tenant"] = effectiveTenant;
  }

  const response = await fetch(`${env.VITE_API_URL}/graphql`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      query: payload.query,
      variables: payload.variables,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data from API");
  }

  const body = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join(", "));
  }

  if (!body.data) {
    throw new Error("No data returned from API");
  }

  return body.data;
}

export const gql = String.raw;
