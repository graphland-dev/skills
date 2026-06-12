import { auth } from "@/lib/auth";

export const SOCIAL_PROVIDERS = ["github", "google"] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const accountQueryKeys = {
  all: ["account"] as const,
  linkedAccounts: () => [...accountQueryKeys.all, "linked-accounts"] as const,
};

export type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type UpdateAccountProfileInput = {
  name: string;
};

export function getProviderLabel(providerId: string) {
  switch (providerId) {
    case "github":
      return "GitHub";
    case "google":
      return "Google";
    default:
      return providerId;
  }
}

export async function listLinkedAccounts() {
  const { data, error } = await auth.listAccounts();

  if (error) {
    throw new Error(error.message ?? "Failed to load linked accounts");
  }

  return (data ?? []) as LinkedAccount[];
}

export async function updateAccountProfile(input: UpdateAccountProfileInput) {
  const { error } = await auth.updateUser({
    name: input.name.trim(),
  });

  if (error) {
    throw new Error(error.message ?? "Failed to update profile");
  }
}

export async function linkSocialAccount(provider: SocialProvider) {
  const { error } = await auth.linkSocial({
    provider,
    callbackURL: `${window.location.origin}/account`,
  });

  if (error) {
    throw new Error(error.message ?? `Failed to link ${getProviderLabel(provider)}`);
  }
}

export async function unlinkSocialAccount(providerId: string) {
  const { error } = await auth.unlinkAccount({ providerId });

  if (error) {
    throw new Error(error.message ?? "Failed to unlink account");
  }
}
