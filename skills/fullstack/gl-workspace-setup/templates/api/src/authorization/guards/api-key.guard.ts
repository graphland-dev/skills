import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyService } from '@/api/api-key/api-key.service';
import { API_KEY_PREFIX } from '@/api/api-key/api-key.contracts';
import { REQUEST_ORGANIZATION_ID } from '@/authorization/constants';

@Injectable()
export class ApiKeyGuardHost implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const verified = await this.apiKeyService.verify(apiKey);

    if (!verified) {
      throw new UnauthorizedException('Invalid API key');
    }

    (request as Request & { [REQUEST_ORGANIZATION_ID]?: string })[
      REQUEST_ORGANIZATION_ID
    ] = verified.organizationId;

    return true;
  }
}

function extractApiKey(request: Request): string | null {
  const xApiKey = request.headers['x-api-key'];
  if (typeof xApiKey === 'string' && xApiKey.length > 0) {
    return xApiKey;
  }

  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string') {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  if (!token.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  return token;
}
