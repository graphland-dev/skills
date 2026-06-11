import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { organization, openAPI, bearer } from 'better-auth/plugins';
import type { Db } from 'mongodb';
import { Logger } from '@nestjs/common';
import {
  CORE_AUTH_MODEL_OPTIONS,
  ORGANIZATION_AUTH_SCHEMA,
} from '@/auth/auth-collections';
import type { OrganizationInvitationMailData } from '@/auth/organization-invitation-mail.service';
import {
  organizationAccessControl,
  organizationRoles,
} from '@/auth/organization-access';

const logger = new Logger('BetterAuth');

export interface OAuthProviderCredentials {
  clientId?: string;
  clientSecret?: string;
}

export interface CreateAuthOptions {
  db: Db;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  disableCsrfCheck?: boolean;
  github?: OAuthProviderCredentials;
  google?: OAuthProviderCredentials;
  sendOrganizationInvitationEmail?: (
    data: OrganizationInvitationMailData,
  ) => Promise<void>;
}

function buildSocialProviders(options: {
  github?: OAuthProviderCredentials;
  google?: OAuthProviderCredentials;
}) {
  const providers: Record<string, { clientId: string; clientSecret: string }> =
    {};

  if (options.github?.clientId && options.github.clientSecret) {
    providers.github = {
      clientId: options.github.clientId,
      clientSecret: options.github.clientSecret,
    };
  }

  if (options.google?.clientId && options.google.clientSecret) {
    providers.google = {
      clientId: options.google.clientId,
      clientSecret: options.google.clientSecret,
    };
  }

  return providers;
}

export function createAuth(options: CreateAuthOptions) {
  const {
    db,
    secret,
    baseURL,
    trustedOrigins,
    disableCsrfCheck = true,
    github,
    google,
    sendOrganizationInvitationEmail,
  } = options;

  const socialProviders = buildSocialProviders({ github, google });

  return betterAuth({
    secret,
    baseURL,
    basePath: '/auth',
    trustedOrigins,
    advanced: {
      disableCSRFCheck: disableCsrfCheck,
    },
    database: mongodbAdapter(db),
    experimental: { joins: true },
    emailAndPassword: {
      enabled: true,
    },
    ...CORE_AUTH_MODEL_OPTIONS,
    databaseHooks: {},
    plugins: [
      openAPI(),
      bearer(),
      organization({
        ac: organizationAccessControl,
        roles: organizationRoles,
        creatorRole: 'owner',
        allowUserToCreateOrganization: true,
        requireEmailVerificationOnInvitation: false,
        sendInvitationEmail: sendOrganizationInvitationEmail
          ? async (data) => sendOrganizationInvitationEmail(data)
          : async (data) => {
              logger.warn(
                `Organization invitation email skipped for ${data.email} (mail not configured)`,
              );
            },
        schema: ORGANIZATION_AUTH_SCHEMA,
        organizationHooks: {
          afterDeleteOrganization: async ({ organization }) => {
            const organizationId = organization.id;
            await Promise.all([
              db.collection('sessions').deleteMany({ organizationId }),
              db.collection('api_keys').deleteMany({ organizationId }),
              db.collection('sms_logs').deleteMany({ organizationId }),
            ]);
          },
        },
      }),
    ],
    socialProviders,
  });
}

export type Auth = ReturnType<typeof createAuth>;
