import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// Mongoose 9 renamed FilterQuery<T> to QueryFilter<T>
import type { QueryFilter } from 'mongoose';
import { Entity, EntityDocument } from './entities/entity.entity';

/**
 * Data layer: the only place that touches Mongoose for this feature.
 * Every query is org-scoped — callers must pass organizationId.
 */
@Injectable()
export class EntityRepositoryService {
  constructor(
    @InjectModel(Entity.name)
    private readonly entityModel: Model<EntityDocument>,
  ) {}

  create(data: Partial<Entity>): Promise<EntityDocument> {
    return this.entityModel.create(data);
  }

  async findManyPaginated(
    filter: QueryFilter<Entity>,
    page: number,
    limit: number,
  ): Promise<{ data: EntityDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      this.entityModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.entityModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  }

  findOne(filter: QueryFilter<Entity>): Promise<EntityDocument | null> {
    return this.entityModel.findOne(filter).exec();
  }

  updateOne(
    filter: QueryFilter<Entity>,
    data: Partial<Entity>,
  ): Promise<EntityDocument | null> {
    return this.entityModel
      .findOneAndUpdate(filter, { $set: data }, { returnDocument: 'after' })
      .exec();
  }

  deleteOne(filter: QueryFilter<Entity>): Promise<EntityDocument | null> {
    return this.entityModel.findOneAndDelete(filter).exec();
  }

  /** Cascade hook: wipe all documents of an organization (org deletion). */
  deleteByOrganizationId(
    organizationId: string,
  ): Promise<{ deletedCount?: number }> {
    return this.entityModel.deleteMany({ organizationId }).exec();
  }
}
