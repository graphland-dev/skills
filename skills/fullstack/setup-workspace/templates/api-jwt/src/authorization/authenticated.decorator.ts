import { RolesService } from '@/api/identity/roles/roles.service';
import { UserService } from '@/api/identity/user/user.service';
import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticationGuard } from '@/authorization/decorators/authenticated.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
    private userService: UserService,
  ) {}

  hasPermission(
    collectionName: string,
    requiredPrivileges: string[],
    userAllocatedPermissions: { collectionName: string; actions: string[] }[],
  ) {
    const matchedPermission = userAllocatedPermissions.find(
      (p) => p.collectionName == collectionName,
    );

    if (!matchedPermission) {
      return false;
    }

    const matchedPermissionPreviliges = matchedPermission.actions ?? [];

    return matchedPermissionPreviliges.some((privilege) =>
      requiredPrivileges.includes(privilege),
    );
  }

  async canActivate(context: ExecutionContext) {
    const requiredPrivileges = this.reflector.get<string[]>(
      'privileges',
      context.getHandler(),
    );

    const collectionName = this.reflector.get<string>(
      'collectionName',
      context.getHandler(),
    );

    if (context.getType() === 'http') {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlRequest = ctx.getContext().req;
    const tenantUID = gqlRequest.headers['x-tenant'];

    const identityUser = await this.userService.userModel
      .findOne({ _id: gqlRequest.user?.sub })
      .select('systemRoles memberships');

    if (tenantUID) {
      const selectedTenant = identityUser?.memberships?.find(
        (m) => m.tenant === tenantUID,
      );
      if (!selectedTenant) return false;
      const tenantRoles = selectedTenant.roles;

      const roles = await this.rolesService.roleModel.find({
        name: { $in: tenantRoles },
      });

      const roleCombinedPermissions = roles.reduce((acc, curr) => {
        return [...acc, ...curr.permissions];
      }, []);

      return this.hasPermission(
        collectionName,
        requiredPrivileges,
        roleCombinedPermissions,
      );
    }

    if (!tenantUID) {
      if (!Boolean(identityUser?.systemRoles)) {
        return false;
      }

      const roles = await this.rolesService.roleModel.find({
        name: { $in: identityUser.systemRoles },
      });

      const roleCombinedPermissions = roles.reduce((acc, curr) => {
        return [...acc, ...curr.permissions];
      }, []);

      return this.hasPermission(
        collectionName,
        requiredPrivileges,
        roleCombinedPermissions,
      );
    }

    return true;
  }
}

export type TPermissionPrivilege =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | '*';

interface IAuthenticatorOptions {
  collectionName?: string;
  privileges?: TPermissionPrivilege[];
}

export const Authenticated = (options?: IAuthenticatorOptions) => {
  const decorators = [
    UseGuards(new AuthenticationGuard()),
    SetMetadata('privileges', options?.privileges),
    SetMetadata('collectionName', options?.collectionName ?? undefined),
    ApiBearerAuth(),
  ];

  if (options?.privileges && options?.privileges.length > 0) {
    decorators.push(UseGuards(PermissionGuard));
  }

  return applyDecorators(...decorators);
};
