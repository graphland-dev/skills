import { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common/decorators';
import { GqlExecutionContext } from '@nestjs/graphql';

export const TenantName = createParamDecorator(
  (_, context: ExecutionContext) => {
    let tenantId: string;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      tenantId = request.headers['x-tenant'];
    } else {
      const ctx = GqlExecutionContext.create(context);
      const gqlRequest = ctx.getContext().req;

      const tenantInput = gqlRequest?.body?.variables?.tenant;
      tenantId = gqlRequest.headers['x-tenant'] || tenantInput;
    }

    return tenantId;
  },
);
