import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizationId } from '@/common/decorators/organization-id.decorator';
import {
  CreateEntityDto,
  EntityListQueryDto,
  EntityResponseDto,
  PaginatedEntitiesResponseDto,
  UpdateEntityDto,
} from './dto/entity.dto';
import { EntityService } from './entity.service';

// Production projects add the auth guard here, e.g. @UserSessionGuard() or
// @ApiKeyGuard() per endpoint — see references/auth.md.
@ApiTags('Entities')
@Controller('v1/entities')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Post()
  @ApiOperation({ summary: 'Create an entity' })
  create(
    @OrganizationId() organizationId: string,
    @Body() input: CreateEntityDto,
  ): Promise<EntityResponseDto> {
    return this.entityService.create(input, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List entities for the organization (paginated)' })
  findMany(
    @OrganizationId() organizationId: string,
    @Query() query: EntityListQueryDto,
  ): Promise<PaginatedEntitiesResponseDto> {
    return this.entityService.findMany(query, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single entity' })
  findOne(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ): Promise<EntityResponseDto> {
    return this.entityService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an entity' })
  update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() input: UpdateEntityDto,
  ): Promise<EntityResponseDto> {
    return this.entityService.update(id, input, organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an entity' })
  remove(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.entityService.remove(id, organizationId);
  }
}
