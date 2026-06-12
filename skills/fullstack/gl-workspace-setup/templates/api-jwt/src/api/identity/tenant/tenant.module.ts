import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { Tenant, TenantSchema } from '@/entities/identity/tenant.entity';
import { TenantResolver } from './tenant.resolver';
import { TenantService } from './tenant.service';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        schema: TenantSchema,
        name: Tenant.name,
      },
    ]),
    UserModule,
    RolesModule,
  ],
  providers: [TenantResolver, TenantService],
  exports: [TenantService],
})
export class TenantModule {}
