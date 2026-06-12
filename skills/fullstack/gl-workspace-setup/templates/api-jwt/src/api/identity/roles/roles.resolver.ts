import { Authenticated } from '@/authorization/authenticated.decorator';
import { TenantName } from '@/authorization/decorators/tenantID.decorator';
import {
  AuthenticatedUser,
  type IAuthUser,
} from '@/authorization/decorators/user.decorator';
import { CommonFindDocumentDto } from '@/common/dto/CommonFindDocumentDto';
import { CommonPaginationDto } from '@/common/dto/CommonPaginationDto';
import { CommonMutationResponse } from '@/common/reference-models/common-mutation.entity';
import {
  filterWithTenant,
  filterWithTenantForFindOne,
} from '@/common/utils/filter-with-tenant';
import getGqlFields from '@/common/utils/gql-fields';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { RolePermission } from '@/entities/identity/permission.entity';
import { Role, RolesWithPagination } from '@/entities/identity/role.entity';
import { RolesService } from './roles.service';

@Resolver(() => Role)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @Mutation(() => Boolean, { name: 'identity__BootstrapRoles' })
  async bootstrap() {
    this.rolesService.bootstrapGlobalRoles();
    return true;
  }

  @Mutation(() => CommonMutationResponse, { name: 'identity__createRole' })
  @Authenticated({
    privileges: ['*', 'create'],
    collectionName: 'identity__Role',
  })
  createRole(
    @Args('body') body: CreateRoleInput,
    @TenantName() tenant: string,
  ) {
    try {
      return this.rolesService.createOne({ ...body, tenant });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Query(() => RolesWithPagination, { name: 'identity__roles' })
  @Authenticated({
    privileges: ['*', 'read'],
    collectionName: 'identity__Role',
  })
  findAll(
    @Args('where', { nullable: true }) where: CommonPaginationDto,
    @TenantName() tenant: string,
    @Info() info: any,
  ) {
    try {
      return this.rolesService.findAllWithPagination(
        filterWithTenant(where, tenant),
        getGqlFields(info, 'nodes'),
      );
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => [Role], { name: 'identity__currentTenantRoles' })
  @Authenticated({
    privileges: ['*', 'read'],
    collectionName: 'identity__Role',
  })
  async currentTenantRoles(@TenantName() tenant: string) {
    try {
      const response = await this.rolesService.roleModel.find({
        $or: [{ tenant: { $eq: tenant } }, { tenant: { $eq: null } }],
      });

      return response;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Mutation(() => Boolean, { name: 'identity__updateRole' })
  @Authenticated({
    privileges: ['*', 'update'],
    collectionName: 'identity__Role',
  })
  async updateRole(
    @Args('body') body: UpdateRoleInput,
    @Args('where') where: CommonFindDocumentDto,
    @TenantName() tenant: string,
  ) {
    try {
      const res = await this.rolesService.updateOne(
        filterWithTenantForFindOne(where, tenant),
        body,
      );
      return res.modifiedCount > 0;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, { name: 'identity__removeRole' })
  @Authenticated({
    privileges: ['*', 'delete'],
    collectionName: 'identity__Role',
  })
  async removeRole(@Args('where') where: CommonFindDocumentDto) {
    try {
      const res = await this.rolesService.deleteOne(where);
      return res.deletedCount > 0;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Query(() => [RolePermission], {
    nullable: true,
    name: 'identity__myPermissions',
  })
  @Authenticated()
  async myPermissions(
    @Args('tenant') tenant: string,
    @AuthenticatedUser() user: IAuthUser,
  ) {
    try {
      return this.rolesService.myPermissions(tenant, user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
