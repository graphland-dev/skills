import { randomBytes } from 'node:crypto';

export function orgSlugFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? 'org';
  const base = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const suffix = randomBytes(3).toString('hex');
  return `${base || 'org'}-${suffix}`;
}
