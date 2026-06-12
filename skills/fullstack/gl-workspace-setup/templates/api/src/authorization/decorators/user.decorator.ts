import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface ISessionUser {
  sub: string;
  roles?: string[];
}

export interface SessionUserPayload {
  id: string;
  email: string;
  name?: string | null;
}

export const SessionUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUserPayload => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: SessionUserPayload }>();

    if (!request.user?.id || !request.user.email) {
      throw new Error('SessionUser is only available after UserSessionGuard');
    }

    return request.user;
  },
);
