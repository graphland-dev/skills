import { Authenticated } from '@/authorization/authenticated.decorator';
import { TenantName } from '@/authorization/decorators/tenantID.decorator';
import {
  AuthenticatedUser,
  type IAuthUser,
} from '@/authorization/decorators/user.decorator';
import {
  CommonFindDocumentDto,
  MatchOperator,
} from '@/common/dto/CommonFindDocumentDto';
import { CommonPaginationDto } from '@/common/dto/CommonPaginationDto';
import { CommonMutationResponse } from '@/common/reference-models/common-mutation.entity';
import { filterWithTenantForFindOne } from '@/common/utils/filter-with-tenant';
import getGqlFields from '@/common/utils/gql-fields';
import { ForbiddenException } from '@nestjs/common';
import {
  Args,
  Info,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CreateTenantInput } from './dto/create-tenant.input';
import { UpdateTenantInput } from './dto/update-tenant.input';
import { Tenant, TenantsWithPagination } from '@/entities/identity/tenant.entity';
import { TenantService } from './tenant.service';

@Resolver(() => Tenant)
export class TenantResolver {
  constructor(private readonly tenantService: TenantService) {}

  @ResolveField(() => String, { nullable: true })
  themeJson(@Parent() tenant: Tenant): string | null {
    if (tenant.themeJson == null) return null;
    return JSON.stringify(tenant.themeJson);
  }

  private parseThemeJsonInput<T extends { themeJson?: string }>(input: T): T {
    if (input.themeJson == null) return input;
    try {
      return {
        ...input,
        themeJson: JSON.parse(input.themeJson) as Record<string, unknown>,
      };
    } catch {
      return input;
    }
  }

  @Mutation(() => CommonMutationResponse, { name: 'identity__createTenant' })
  @Authenticated({
    collectionName: 'identity__Tenant',
    privileges: ['*', 'create'],
  })
  async createTenant(@Args('input') input: CreateTenantInput) {
    try {
      const payload = this.parseThemeJsonInput(input);
      return await this.tenantService.createOne(payload);
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Mutation(() => Boolean, { name: 'identity__updateTenant' })
  @Authenticated({
    collectionName: 'identity__Tenant',
    privileges: ['*', 'update'],
  })
  async updateTenant(
    @Args('where', { nullable: true }) where: CommonFindDocumentDto,
    @Args('input') input: UpdateTenantInput,
    @TenantName() tenant: string,
  ) {
    try {
      const payload = this.parseThemeJsonInput(input);
      await this.tenantService.updateOne(
        filterWithTenantForFindOne(where, tenant),
        payload,
      );
      return true;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Mutation(() => Boolean, {
    name: 'identity__updateCurrentTenant',
  })
  @Authenticated({
    collectionName: 'identity__Tenant',
    privileges: ['*', 'update'],
  })
  async updateCurrentTenant(
    @Args('input') input: UpdateTenantInput,
    @TenantName() tenant: string,
  ) {
    try {
      const payload = this.parseThemeJsonInput(input);
      const res = await this.tenantService.updateOne(
        { key: 'uid', operator: MatchOperator.eq, value: tenant },
        payload,
      );
      return res.modifiedCount > 0;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => TenantsWithPagination, { name: 'identity__tenants' })
  @Authenticated({
    collectionName: 'identity__Tenant',
    privileges: ['*', 'read'],
  })
  findAll(
    @Args('where', { nullable: true }) where: CommonPaginationDto,
    @Info() info: any,
  ) {
    try {
      return this.tenantService.findAllWithPagination(
        where,
        getGqlFields(info, 'nodes'),
        [{ path: 'tenant' }],
      );
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => Boolean, {
    name: 'identity__isTenantUidExists',
    description: 'Check if tenant uid exists',
  })
  async isTenantUidExists(@Args('uid') uid: string) {
    try {
      const response = await this.tenantService.tenantModel.countDocuments({
        uid,
      });

      return response > 0;
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  // FIXME: Fix without x-tenant permission error
  @Query(() => TenantsWithPagination, { name: 'identity__myTenants' })
  @Authenticated()
  myTenants(@AuthenticatedUser() _user: IAuthUser) {
    try {
      return this.tenantService.findMyTenants(_user);
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => Tenant, { name: 'identity__tenant' })
  @Authenticated({
    collectionName: 'identity__Tenant',
    privileges: ['*', 'read'],
  })
  findOne(
    @Args('where', { nullable: true }) where: CommonFindDocumentDto,
    @Info() info: any,
  ) {
    try {
      return this.tenantService.findOne(where, getGqlFields(info));
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  @Query(() => Tenant, { name: 'identity__publicCurrentTenant' })
  publicCurrentTenant(@TenantName() tenant: string, @Info() info: any) {
    try {
      if (!tenant) throw new ForbiddenException(`You didn't passed tenant`);

      return this.tenantService.findOne(
        {
          key: 'uid',
          operator: MatchOperator.eq,
          value: tenant,
        },
        getGqlFields(info),
      );
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }
}
