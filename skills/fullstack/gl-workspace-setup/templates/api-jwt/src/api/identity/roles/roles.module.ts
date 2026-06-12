import { Module, forwardRef } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesResolver } from './roles.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '@/entities/identity/role.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        schema: RoleSchema,
        name: Role.name,
      },
    ]),
    forwardRef(() => UserModule),
  ],
  providers: [RolesResolver, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
