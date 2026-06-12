import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [TenantModule, UserModule, AuthModule, RolesModule],
  exports: [TenantModule, UserModule, AuthModule, RolesModule],
})
export class IdentityModule {}
