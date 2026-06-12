function escapeRegex(pattern: string): string {
  return pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

export function parseOrigins(
  ...values: Array<string | undefined>
): string[] {
  const origins = new Set<string>();

  for (const value of values) {
    const raw = value?.trim();
    if (!raw) {
      continue;
    }

    for (const origin of raw.split(',')) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  return [...origins];
}

export function isAllowedOrigin(
  origin: string,
  trustedOrigins: string[],
): boolean {
  return trustedOrigins.some((pattern) => {
    if (pattern === '*') {
      return true;
    }

    const regex = new RegExp(
      `^${pattern.split('*').map(escapeRegex).join('.*')}$`,
    );

    return regex.test(origin);
  });
}

export function toCorsOriginOption(
  origins: string[],
): boolean | string | string[] {
  if (origins.length === 0) {
    return true;
  }

  if (origins.length === 1) {
    return origins[0]!;
  }

  return origins;
}
