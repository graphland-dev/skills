import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the active organization id for org-scoped multi-tenancy.
 * In production this is populated by the auth guard (Better Auth session or
 * API-key guard) onto request.organizationId — see references/auth.md.
 */
export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { organizationId?: string }>();

    const organizationId =
      request.organizationId ??
      (request.headers['x-organization-id'] as string | undefined);

    if (!organizationId) {
      throw new UnauthorizedException('No active organization');
    }

    return organizationId;
  },
);
