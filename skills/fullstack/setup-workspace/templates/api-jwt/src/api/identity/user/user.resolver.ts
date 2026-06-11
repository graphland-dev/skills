import { Authenticated } from '@/authorization/authenticated.decorator';
import { CommittedByUser } from '@/authorization/decorators/commiterUser.decorator';
import { TenantName } from '@/authorization/decorators/tenantID.decorator';
import {
  AuthenticatedUser,
  type IAuthUser,
} from '@/authorization/decorators/user.decorator';
import { UserReference } from '@/common/common-models/user-reference.model';
import {
  CommonFindDocumentDto,
  MatchOperator,
} from '@/common/dto/CommonFindDocumentDto';
import { CommonPaginationDto } from '@/common/dto/CommonPaginationDto';
import {
  AppException,
  AppExceptionCode,
} from '@/common/exceptions/app-exception';
import { CommonMutationResponse } from '@/common/reference-models/common-mutation.entity';
import { filterWithPreCondition } from '@/common/utils/filter-with-pre-condition';
import { filterWithTenant } from '@/common/utils/filter-with-tenant';
import getGqlFields from '@/common/utils/gql-fields';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Args, ID, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import {
  AddUserToTenantInput,
  CreateUserByAdminInput,
  UpdateMeInput,
  UpdateMyPasswordInput,
} from './dto/create-user.input';
import { UpdateUserFromAdmin } from './dto/update-user.input';
import type { UserTenantMembershipRole } from '@/entities/identity/user-tenant.entity';
import { User, UsersWithPagination } from '@/entities/identity/user.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => CommonMutationResponse, {
    name: 'identity__createUser',
    description: `
      🔐 Authenticated \n
      This mutation is used to create a new user. \n
      This is a system admin only mutation. \n
      {
        permissions: ['*', 'create'],
        collectionName: 'identity__User',
      }
    `,
  })
  @Authenticated({
    privileges: ['*', 'create'],
    collectionName: 'identity__User',
  })
  createUser(@Args('input') input: CreateUserByAdminInput) {
    try {
      return this.userService.createUserAccountFromAdmin(input);
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Mutation(() => Boolean, {
    name: 'identity__updateUser',
    description: `
      🔐 Authenticated \n
      This mutation is used to create a new user. \n
      This is a system admin only mutation. \n
      {
        permissions: ['*', 'create'],
        collectionName: 'identity__User',
      }
    `,
  })
  @Authenticated({
    privileges: ['*', 'update'],
    collectionName: 'identity__User',
  })
  async updateUser(
    @Args('body') body: UpdateUserFromAdmin,
    @Args('where') where: CommonFindDocumentDto,
    @CommittedByUser() commiterUser: UserReference,
  ) {
    try {
      await this.userService.updateUserFromAdmin(body, where, commiterUser);
      return true;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => UsersWithPagination, { name: 'identity__users' })
  @Authenticated({
    collectionName: 'identity__User',
    privileges: ['*', 'read'],
  })
  findAll(
    @Args('where', { nullable: true }) where: CommonPaginationDto,
    @Info() info: any,
    @TenantName() tenant: string,
  ) {
    try {
      return this.userService.findAllWithPagination(
        filterWithTenant(where, tenant),
        getGqlFields(info, 'nodes'),
      );
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => User, { nullable: true, name: 'identity__me' })
  @Authenticated()
  async me(@AuthenticatedUser() user: IAuthUser, @Info() info: any) {
    try {
      return this.userService.findOne(
        {
          key: '_id',
          operator: MatchOperator.eq,
          value: user.sub,
        },
        getGqlFields(info),
        [{ path: 'tenants' }],
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, { nullable: true, name: 'identity__updateMe' })
  @Authenticated()
  async updateMe(
    @AuthenticatedUser() user: IAuthUser,
    @Args('input') input: UpdateMeInput,
  ) {
    try {
      await this.userService.userModel.updateOne({ _id: user.sub }, input);
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, {
    nullable: true,
    name: 'identity__updateMyPassword',
  })
  @Authenticated()
  async updateMyPassword(
    @AuthenticatedUser() user: IAuthUser,
    @Args('input') input: UpdateMyPasswordInput,
  ) {
    try {
      await this.userService.updateUserPassword(user.sub, input);
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Query(() => UsersWithPagination, {
    nullable: true,
    name: 'identity__currentTenantUsers',
  })
  @Authenticated({
    collectionName: 'identity__User',
    privileges: ['*', 'read'],
  })
  async currentTenantUsers(
    @AuthenticatedUser() user: IAuthUser,
    @Info() info: any,
    @Args('input', { nullable: true }) input: CommonPaginationDto,
    @TenantName() tenant: string,
  ) {
    const _input = filterWithPreCondition(input, {
      key: 'memberships.tenant',
      operator: MatchOperator.eq,
      value: tenant,
    });

    try {
      return this.userService.findAllWithPagination(
        _input,
        getGqlFields(info, 'nodes'),
        [],
        {
          $and: [
            { 'memberships.tenant': tenant },
            // { 'memberships.userDomain': UserDomain.MERCHANT },
          ],
        },
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, {
    name: 'identity__addUserToCurrentTenant',
  })
  @Authenticated({
    collectionName: 'identity__User',
    privileges: ['*', 'update'],
  })
  addUserToCurrentTenant(
    @Args('input') input: AddUserToTenantInput,
    @TenantName() tenant: string,
    @CommittedByUser() commiterUser: UserReference,
  ) {
    try {
      return this.userService.addUserToTenant(input, tenant, commiterUser);
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Mutation(() => Boolean, {
    name: 'identity__updateCurrentTenantUserRole',
  })
  @Authenticated({
    collectionName: 'identity__User',
    privileges: ['*', 'update'],
  })
  async updateCurrentTenantUserRole(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('roles', { type: () => [String] }) roles: UserTenantMembershipRole[],
    @TenantName() tenant: string,
    @CommittedByUser() user: UserReference,
  ) {
    try {
      if (!roles.some((role) => /^(merchant:|customer:)/.test(role)))
        throw new AppException(
          AppExceptionCode.FORBIDDEN,
          'Roles must be one of "merchant:*" or "customer:*"',
        );
      const filteredUser = await this.userService.userModel.findOne({
        _id: userId,
      });
      if (!filteredUser) throw new NotFoundException('User not found');

      const memberships = filteredUser?.memberships || [];
      const index = memberships?.findIndex((i) => i?.tenant === tenant);

      if (index != -1) {
        memberships[index].roles = roles;
      }

      const updated = await this.userService.userModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        {
          $set: { memberships },
          $push: {
            commits: {
              action: 'update-user-tenant-role',
              commitedBy: user,
              committedAt: new Date(),
            },
          },
        },
      );

      return updated.matchedCount > 0;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Mutation(() => Boolean, {
    name: 'identity__removeUserTenantMembership',
  })
  @Authenticated({
    collectionName: 'identity__User',
    privileges: ['*', 'update'],
  })
  async removeUserTenantMembership(
    @Args('userId', { type: () => ID }) userId: string,
    @TenantName() tenant: string,
    @CommittedByUser() user: UserReference,
  ) {
    try {
      const filteredUser = await this.userService.userModel.findOne({
        _id: userId,
      });
      if (!filteredUser)
        throw new AppException(AppExceptionCode.NOT_FOUND, 'Uer not found');

      const updated = await this.userService.userModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        {
          $set: {
            memberships: filteredUser?.memberships.filter(
              (i) => i.tenant != tenant,
            ),
          },
          $push: {
            commits: [
              {
                action: 'remove-from-tenant',
                commitedBy: user,
                committedAt: new Date(),
              },
            ],
          },
        },
      );

      return updated.matchedCount > 0;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }
}
