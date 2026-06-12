import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import type { Auth } from '@/auth/create-auth';
import { REQUEST_ORGANIZATION_ID } from '@/authorization/constants';

type SessionWithActiveOrganization = {
  activeOrganizationId?: string | null;
};

@Injectable()
export class UserSessionGuardHost implements CanActivate {
  constructor(private readonly authService: AuthService<Auth>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.authService.instance.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    Object.assign(request, { session, user: session.user });

    const organizationId = (session.session as SessionWithActiveOrganization)
      .activeOrganizationId;
    if (organizationId) {
      (request as Request & { [REQUEST_ORGANIZATION_ID]?: string })[
        REQUEST_ORGANIZATION_ID
      ] = organizationId;
    }

    return true;
  }
}
