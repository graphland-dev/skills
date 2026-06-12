import { Global, Module } from '@nestjs/common';
import { UserSessionGuardHost } from '@/authorization/guards/user-session.guard';

@Global()
@Module({
  providers: [UserSessionGuardHost],
  exports: [UserSessionGuardHost],
})
export class AuthorizationModule {}
