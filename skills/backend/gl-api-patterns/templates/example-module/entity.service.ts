import { Injectable, NotFoundException } from '@nestjs/common';
// Mongoose 9 renamed FilterQuery<T> to QueryFilter<T>
import type { QueryFilter } from 'mongoose';
import {
  CreateEntityDto,
  EntityListQueryDto,
  EntityResponseDto,
  PaginatedEntitiesResponseDto,
  UpdateEntityDto,
} from './dto/entity.dto';
import { Entity, EntityDocument } from './entities/entity.entity';
import { EntityRepositoryService } from './entity.repository.service';

/**
 * Business logic. The controller stays thin; the repository stays dumb.
 * Every public method takes organizationId — never trust ids from the body.
 */
@Injectable()
export class EntityService {
  constructor(private readonly entityRepository: EntityRepositoryService) {}

  async create(
    input: CreateEntityDto,
    organizationId: string,
  ): Promise<EntityResponseDto> {
    const document = await this.entityRepository.create({
      ...input,
      organizationId,
    });
    return this.toResponse(document);
  }

  async findMany(
    query: EntityListQueryDto,
    organizationId: string,
  ): Promise<PaginatedEntitiesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: QueryFilter<Entity> = { organizationId };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const { data, total } = await this.entityRepository.findManyPaginated(
      filter,
      page,
      limit,
    );

    return {
      data: data.map((doc) => this.toResponse(doc)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<EntityResponseDto> {
    const document = await this.entityRepository.findOne({
      _id: id,
      organizationId,
    });
    if (!document) {
      throw new NotFoundException('Entity not found');
    }
    return this.toResponse(document);
  }

  async update(
    id: string,
    input: UpdateEntityDto,
    organizationId: string,
  ): Promise<EntityResponseDto> {
    const document = await this.entityRepository.updateOne(
      { _id: id, organizationId },
      input,
    );
    if (!document) {
      throw new NotFoundException('Entity not found');
    }
    return this.toResponse(document);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const document = await this.entityRepository.deleteOne({
      _id: id,
      organizationId,
    });
    if (!document) {
      throw new NotFoundException('Entity not found');
    }
  }

  private toResponse(document: EntityDocument): EntityResponseDto {
    return {
      id: document._id.toString(),
      name: document.name,
      description: document.description,
      status: document.status,
      createdAt: document.createdAt as Date,
      updatedAt: document.updatedAt as Date,
    };
  }
}
