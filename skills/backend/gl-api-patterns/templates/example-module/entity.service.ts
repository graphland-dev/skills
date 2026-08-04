import { Injectable, NotFoundException } from '@nestjs/common';
import { and, contains, eq } from '@/common/database/persistence-query-builder';
import {
  CreateEntityDto,
  EntityListQueryDto,
  EntityResponseDto,
  PaginatedEntitiesResponseDto,
  UpdateEntityDto,
} from './dto/entity.dto';
import { EntityDocument } from './entities/entity.entity';
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
    const document = (await this.entityRepository.create({
      data: { ...input, organizationId },
    })) as EntityDocument;

    return this.toResponse(document);
  }

  async findMany(
    query: EntityListQueryDto,
    organizationId: string,
  ): Promise<PaginatedEntitiesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters = [eq('organizationId', organizationId)];
    if (query.status) {
      filters.push(eq('status', query.status));
    }
    if (query.search) {
      filters.push(contains('name', query.search));
    }

    const result = await this.entityRepository.findAllWithPagination({
      where: and(...filters),
      pagination: { page, limit, sortBy: 'createdAt' },
    });

    return {
      data: (result.data as EntityDocument[]).map((doc) =>
        this.toResponse(doc),
      ),
      meta: {
        page: result.meta.currentPage,
        limit,
        total: result.meta.totalCount,
        totalPages: result.meta.totalPages,
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<EntityResponseDto> {
    const document = await this.requireEntity(id, organizationId);
    return this.toResponse(document);
  }

  async update(
    id: string,
    input: UpdateEntityDto,
    organizationId: string,
  ): Promise<EntityResponseDto> {
    await this.requireEntity(id, organizationId);

    const result = await this.entityRepository.update({
      where: and(eq('_id', id), eq('organizationId', organizationId)),
      data: input,
    });

    return this.toResponse(result.document as EntityDocument);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.requireEntity(id, organizationId);

    await this.entityRepository.deleteOne({
      where: and(eq('_id', id), eq('organizationId', organizationId)),
    });
  }

  private async requireEntity(
    id: string,
    organizationId: string,
  ): Promise<EntityDocument> {
    const document = await this.entityRepository.findByIdForOrganization(
      id,
      organizationId,
    );

    if (!document) {
      throw new NotFoundException('Entity not found');
    }

    return document;
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
