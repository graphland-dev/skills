import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { REQUEST_ORGANIZATION_ID } from '@/authorization/constants';

export const OrganizationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { [REQUEST_ORGANIZATION_ID]?: string }>();

    const organizationId = request[REQUEST_ORGANIZATION_ID];

    if (!organizationId) {
      throw new Error(
        'OrganizationId is only available after UserSessionGuard or ApiKeyGuard',
      );
    }

    return organizationId;
  },
);
