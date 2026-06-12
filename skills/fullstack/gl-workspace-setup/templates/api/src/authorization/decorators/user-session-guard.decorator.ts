import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserSessionGuardHost } from '@/authorization/guards/user-session.guard';

export function UserSessionGuard() {
  return applyDecorators(
    UseGuards(UserSessionGuardHost),
    ApiBearerAuth('user-session'),
    ApiUnauthorizedResponse({
      description: 'Invalid or missing user session token',
    }),
  );
}
