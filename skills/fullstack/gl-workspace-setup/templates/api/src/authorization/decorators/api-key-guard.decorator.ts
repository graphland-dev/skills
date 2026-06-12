import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuardHost } from '@/authorization/guards/api-key.guard';

export function ApiKeyGuard() {
  return applyDecorators(
    UseGuards(ApiKeyGuardHost),
    ApiBearerAuth('x-api-key'),
    ApiUnauthorizedResponse({ description: 'Invalid or missing org API key' }),
  );
}
