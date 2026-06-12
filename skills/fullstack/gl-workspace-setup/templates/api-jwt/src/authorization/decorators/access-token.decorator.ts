import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const AccessToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers.authorization.split(' ')[1];
    return token;
  },
);
