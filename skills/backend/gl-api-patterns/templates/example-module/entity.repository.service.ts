import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { and, eq } from '@/common/database/persistence-query-builder';
import { PersistenceRepositoryService } from '@/common/database/persistence.repository.service';
import { Entity, EntityDocument } from './entities/entity.entity';

/**
 * Data layer: the only place that touches Mongoose for this feature.
 * CRUD + pagination come from PersistenceRepositoryService — don't add a
 * method here just to wrap `findOne`/`update`/`findAllWithPagination` with a
 * one-off filter; call the inherited method with `and`/`eq` straight from
 * the service instead. Only add a method when it's reused across several
 * service methods (like `findByIdForOrganization` below — every mutation
 * needs the same org-scoped lookup) or does something the base class can't
 * (raw-model escape hatches: atomic $inc/$unset, aggregation, bulk deletes).
 */
@Injectable()
export class EntityRepositoryService extends PersistenceRepositoryService<EntityDocument> {
  constructor(
    @InjectModel(Entity.name)
    public readonly entityModel: Model<EntityDocument>,
  ) {
    super(entityModel);
  }

  /** Reused by every service method that needs a single org-scoped entity. */
  findByIdForOrganization(
    id: string,
    organizationId: string,
  ): Promise<EntityDocument | null> {
    return this.findOne({
      where: and<Entity>(eq('_id', id), eq('organizationId', organizationId)),
    }) as Promise<EntityDocument | null>;
  }

  /** Cascade hook: wipe all documents of an organization (org deletion). */
  deleteByOrganizationId(
    organizationId: string,
  ): Promise<{ deletedCount?: number }> {
    return this.entityModel.deleteMany({ organizationId }).exec();
  }
}
