import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { QueryFilter } from 'mongoose'; // Mongoose 9 (was FilterQuery in v8)
import {
  Subscription,
  SubscriptionDocument,
} from './entities/subscription.entity';
import { SubscriptionStatus } from './billing.contracts';

@Injectable()
export class SubscriptionRepositoryService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly model: Model<SubscriptionDocument>,
  ) {}

  create(data: Partial<Subscription>): Promise<SubscriptionDocument> {
    return this.model.create(data);
  }

  findByOrganizationId(
    organizationId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.model.findOne({ organizationId }).exec();
  }

  updateById(
    id: string,
    data: Partial<Subscription>,
  ): Promise<SubscriptionDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .exec();
  }

  // Scheduler queries
  findTrialsExpiredBefore(now: Date): Promise<SubscriptionDocument[]> {
    return this.model
      .find({ status: SubscriptionStatus.TRIALING, trialEndsAt: { $lte: now } })
      .exec();
  }

  findActiveEndingBefore(now: Date): Promise<SubscriptionDocument[]> {
    return this.model
      .find({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: { $lte: now } })
      .exec();
  }

  findByStatusEndingBefore(
    status: SubscriptionStatus,
    now: Date,
  ): Promise<SubscriptionDocument[]> {
    const filter: QueryFilter<Subscription> = {
      status,
      currentPeriodEnd: { $lte: now },
    };
    return this.model.find(filter).exec();
  }

  /** Active subs whose paid period ends within `days`, for renewal reminders. */
  findActiveRenewalCandidates(days: number): Promise<SubscriptionDocument[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.model
      .find({
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { $lte: cutoff },
      })
      .exec();
  }

  /** Past-due subs whose period ended before the grace cutoff → expire. */
  findPastDueExpiredGrace(graceCutoff: Date): Promise<SubscriptionDocument[]> {
    return this.model
      .find({
        status: SubscriptionStatus.PAST_DUE,
        currentPeriodEnd: { $lte: graceCutoff },
      })
      .exec();
  }

  deleteByOrganizationId(
    organizationId: string,
  ): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany({ organizationId }).exec();
  }
}
