import { BaseDatabaseRepository } from '@/common/database/base-database.repository';
import { Injectable } from '@nestjs/common';
import { Role } from '@/entities/identity/role.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IAuthUser } from '@/authorization/decorators/user.decorator';
import { UserService } from '../user/user.service';

@Injectable()
export class RolesService extends BaseDatabaseRepository<Role> {
  constructor(
    @InjectModel(Role.name)
    public readonly roleModel: Model<Role>,
    private readonly userService: UserService,
  ) {
    super(roleModel, {});
  }

  roleEntries: Role[] = [
    {
      name: 'system:admin',
      permissions: [
        { collectionName: 'identity__Tenant', actions: ['*'] },
        { collectionName: 'identity__User', actions: ['*'] },
        { collectionName: 'identity__Role', actions: ['*'] },
        { collectionName: 'inventory__Product', actions: ['*'] },
        { collectionName: 'inventory__Collection', actions: ['*'] },
        { collectionName: 'Coupon', actions: ['*'] },
        { collectionName: 'sale__Invoice', actions: ['*'] },
      ],
    },
    {
      name: 'merchant:admin',
      permissions: [
        { collectionName: 'identity__Tenant', actions: ['read', 'update'] },
        { collectionName: 'identity__User', actions: ['*'] },
        { collectionName: 'inventory__Product', actions: ['*'] },
        { collectionName: 'inventory__Collection', actions: ['*'] },
        { collectionName: 'Coupon', actions: ['*'] },
        { collectionName: 'sale__Invoice', actions: ['*'] },
      ],
    },
    {
      name: 'merchant:manager',
      permissions: [
        { collectionName: 'inventory__Product', actions: ['*'] },
        { collectionName: 'inventory__Collection', actions: ['*'] },
        { collectionName: 'Coupon', actions: ['*'] },
        { collectionName: 'sale__Invoice', actions: ['*'] },
      ],
    },
    {
      name: 'merchant:stuff',
      permissions: [
        { collectionName: 'identity__User', actions: ['*'] },
        { collectionName: 'inventory__Product', actions: ['*'] },
        { collectionName: 'inventory__Collection', actions: ['*'] },
        { collectionName: 'Coupon', actions: ['*'] },
      ],
    },
    {
      name: 'customer',
      permissions: [
        {
          collectionName: 'identity__Tenant',
          actions: ['read'],
        },
      ],
    },
  ];

  bootstrapGlobalRoles() {
    this.roleEntries.forEach(async (role) => {
      const existingRole = await this.roleModel.findOne({
        $and: [{ name: role.name }],
      });
      if (existingRole) {
        await this.roleModel.updateOne(
          { $and: [{ name: role.name }] },
          { permissions: role.permissions },
        );
      } else {
        await this.roleModel.create(role);
      }
    });
  }

  async myPermissions(tenant: string, _user: IAuthUser) {
    const user = await this.userService.userModel
      .findOne({ _id: _user.sub })
      .select('memberships');

    const userAssignedRoles = user.memberships.find(
      (m) => m.tenant === tenant,
    ).roles;

    const roles = await this.roleModel
      .find({
        $and: [{ name: { $in: userAssignedRoles } }],
      })
      .select('permissions');

    const permissions = roles.reduce((acc, role) => {
      role.permissions.forEach((permission) => {
        if (!acc.includes(permission)) {
          acc.push(permission);
        }
      });
      return acc;
    }, []);

    return permissions;
  }
}
