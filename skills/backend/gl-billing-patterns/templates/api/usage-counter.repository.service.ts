import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UsageCounter,
  UsageCounterDocument,
} from './entities/usage-counter.entity';

@Injectable()
export class UsageCounterRepositoryService {
  constructor(
    @InjectModel(UsageCounter.name)
    private readonly model: Model<UsageCounterDocument>,
  ) {}

  findByOrganizationAndPeriod(
    organizationId: string,
    periodKey: string,
  ): Promise<UsageCounterDocument | null> {
    return this.model.findOne({ organizationId, periodKey }).exec();
  }

  /** Atomic upsert + increment for the current period. */
  async incrementRequestsUsed(
    organizationId: string,
    periodKey: string,
  ): Promise<void> {
    await this.model
      .updateOne(
        { organizationId, periodKey },
        { $inc: { requestsUsed: 1 } },
        { upsert: true },
      )
      .exec();
  }

  deleteByOrganizationId(
    organizationId: string,
  ): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany({ organizationId }).exec();
  }
}
