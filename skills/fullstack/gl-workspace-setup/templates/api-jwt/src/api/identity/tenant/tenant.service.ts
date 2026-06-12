import type { IAuthUser } from '@/authorization/decorators/user.decorator';
import { BaseDatabaseRepository } from '@/common/database/base-database.repository';
import { MatchOperator } from '@/common/dto/CommonFindDocumentDto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { Tenant } from '@/entities/identity/tenant.entity';

@Injectable()
export class TenantService extends BaseDatabaseRepository<Tenant> {
  private logger = new Logger();
  constructor(
    @InjectModel(Tenant.name)
    public readonly tenantModel: Model<Tenant>,
    private readonly userService: UserService,
  ) {
    super(tenantModel, {
      ownerUserId: 'owner',
    });
  }

  async findMyTenants(_user: IAuthUser) {
    const user = await this.userService.userModel
      .findOne({ _id: new Types.ObjectId(_user?.sub) })
      .select('memberships');

    const tenants = user?.memberships?.map((membership) => membership.tenant);

    return this.findAllWithPagination({
      limit: -1,
      page: 1,
      filters: [
        {
          and: [
            {
              key: 'uid',
              operator: MatchOperator.in,
              value: tenants?.join(','),
            },
          ],
        },
      ],
    });
  }
}
