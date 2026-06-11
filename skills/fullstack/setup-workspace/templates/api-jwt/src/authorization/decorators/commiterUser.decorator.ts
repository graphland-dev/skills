import { UserReference } from '@/common/common-models/user-reference.model';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// type ROLE = 'JOB_SEEKER' | 'RECRUITER' | 'ADMIN';

export interface IAuthUser {
  sub: string;
  name: string;
  email: string;
  email_verified?: boolean;
  tenantId?: string;
  roles: string[];
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export const CommittedByUser = createParamDecorator(
  (_, context: ExecutionContext) => {
    let user: IAuthUser;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      user = request.user;
    } else {
      const ctx = GqlExecutionContext.create(context);
      const gqlRequest = ctx.getContext().req;
      user = gqlRequest.user;
    }

    return {
      referenceId: user.sub,
      name: user.name,
      email: user.email,
    } as UserReference;
  },
);
