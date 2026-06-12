const ALLOWED_REDIRECT_PATHS = ["/merchant", "/account", "/accept-invitation"] as const;

export type AccessSearch = {
  redirect?: string;
};

export function isSafePostLoginRedirect(redirectTo?: string) {
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
    return false;
  }

  const pathname = redirectTo.split("?")[0] ?? redirectTo;

  return ALLOWED_REDIRECT_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`),
  );
}

export function getPostLoginRedirectPath(redirectTo?: string, fallback = "/merchant") {
  return isSafePostLoginRedirect(redirectTo) ? redirectTo! : fallback;
}
