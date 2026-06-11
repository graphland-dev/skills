import { applyDecorators, ExecutionContext, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiBearerAuth } from '@nestjs/swagger';

export class AuthenticationGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): unknown {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

/** JWT-only auth. Use core's `Authenticated` decorator for permission checks. */
export const JwtAuthenticated = () => {
  return applyDecorators(
    UseGuards(new AuthenticationGuard()),
    ApiBearerAuth(),
  );
};
