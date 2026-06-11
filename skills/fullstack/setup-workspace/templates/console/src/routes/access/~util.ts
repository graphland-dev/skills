import type { AccessSearch } from "@/lib/post-login-redirect";
import { getPostLoginRedirectPath } from "@/lib/post-login-redirect";

export type { AccessSearch };

export type SocialProvider = "github" | "google";

export function parseAccessSearch(
  search: Record<string, unknown>,
): AccessSearch {
  return {
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  };
}

export function getAccessCallbackPath(redirectTo?: string) {
  return getPostLoginRedirectPath(redirectTo);
}
