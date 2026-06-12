import mongoose, { Model, UpdateQuery } from 'mongoose';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { buildQuery, IPersistence } from './persistence-query-builder';
import { AppPaginationResponseDto } from '@/common/dto/AppPaginationResponseDto';
import { UserReference } from '@/common/common-models/user-reference.model';

/**
 * Permission hook types to standardize authorization checks
 */
export type PermissionHook<T> = (
  sessionUser: UserReference | undefined,
  document: T,
  executionId?: string,
) => boolean | Promise<boolean>;

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: SortType;
  sortBy?: string;
}

export interface UpdateOptions<T> {
  where: IPersistence.Filter<T> | IPersistence.Filter<T>[] | undefined;
  data: UpdateQuery<T>;
  sessionUser?: UserReference;
  executionId?: string;
}

export interface CreateOptions<T> {
  data: UpdateQuery<T>;
  sessionUser?: UserReference;
  executionId?: string;
}

/**
 * Find options interface
 */
export interface FindOptions<T> {
  fields?: Array<keyof T>;
  populations?: mongoose.PopulateOptions[];
  sessionUser?: UserReference;
  pagination?: PaginationOptions;
  where?: IPersistence.Filter<T> | undefined;
  executionId?: string;
}

export interface PersistenceHookCallback<T> {
  document: T | Record<string, any>;
  sessionUser?: UserReference;
  executionId?: string;
}

export interface PersistenceHookExecutePayload<T> {
  action: OperationType;
  document: T | Record<string, any>;
  sessionUser?: UserReference;
  executionId?: string;
}

export interface PersistenceBeforeHookUpdateAndDeleteExecutePayload<T> {
  action: OperationType;
  previousDocument: T;
  payload: T | Record<string, any>;
  sessionUser?: UserReference;
  executionId?: string;
}

export interface PersistencePermissionCheckerPayload<T> {
  action: OperationType;
  sessionUser?: UserReference;
  document: T;
  executionId?: string;
}

/**
 * Repository operation types
 */
export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Hook configuration interface
 */
export interface IPersistenceHookConfig<DOCUMENT_TYPE> {
  permissionHooks?: {
    [OperationType.CREATE]?: PermissionHook<DOCUMENT_TYPE>;
    [OperationType.READ]?: PermissionHook<DOCUMENT_TYPE>;
    [OperationType.UPDATE]?: PermissionHook<DOCUMENT_TYPE>;
    [OperationType.DELETE]?: PermissionHook<DOCUMENT_TYPE>;
  };

  // Fixed: beforeHooks should return the correct type
  beforeHooks?: {
    [OperationType.CREATE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<Record<string, any>>;
    [OperationType.UPDATE]?: (
      payload: PersistenceBeforeHookUpdateAndDeleteExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<Record<string, any>>;
    [OperationType.DELETE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<Record<string, any>>;
  };

  afterHooks?: {
    [OperationType.CREATE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<void>;
    [OperationType.READ]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<void>;
    [OperationType.UPDATE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<void>;
    [OperationType.DELETE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<void>;
  };

  keyMapper?: Record<string, string>;
}

export enum SortType {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Enhanced repository base class with a hook system for permissions and data manipulation
 */
@Injectable()
export abstract class PersistenceRepositoryService<DOCUMENT_TYPE> {
  private readonly permissionHooks: {
    [key in OperationType]?: PermissionHook<DOCUMENT_TYPE>;
  } = {};

  private readonly beforeHooks: {
    [key in OperationType]?: (
      callback:
        | PersistenceHookCallback<DOCUMENT_TYPE>
        | PersistenceBeforeHookUpdateAndDeleteExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<DOCUMENT_TYPE>;
  } = {};

  private readonly afterHooks: {
    [key in OperationType]?: (
      callback: PersistenceHookCallback<DOCUMENT_TYPE>,
    ) => void;
  } = {};

  protected readonly keyMapper: Record<string, string> = {};

  protected constructor(
    protected readonly model: Model<DOCUMENT_TYPE>,
    hookConfig?: IPersistenceHookConfig<DOCUMENT_TYPE>,
  ) {
    // Set up permission hooks
    if (hookConfig?.permissionHooks) {
      Object.assign(this.permissionHooks, hookConfig.permissionHooks);
    }

    // Set up before hooks
    if (hookConfig?.beforeHooks) {
      Object.assign(this.beforeHooks, hookConfig.beforeHooks);
    }

    // Set up after hooks
    if (hookConfig?.afterHooks) {
      Object.assign(this.afterHooks, hookConfig.afterHooks);
    }

    // Set up key mapper
    if (hookConfig?.keyMapper) {
      Object.assign(this.keyMapper, hookConfig.keyMapper);
    }

    // Default permission hook if none provided
    // if (!this.permissionHooks[OperationType.UPDATE]) {
    //   this.permissionHooks[OperationType.UPDATE] = this.defaultPermissionCheck;
    // }
    //
    // if (!this.permissionHooks[OperationType.DELETE]) {
    //   this.permissionHooks[OperationType.DELETE] = this.defaultPermissionCheck;
    // }
  }

  //--------------------------------------------------------------------------------
  // Methods
  //--------------------------------------------------------------------------------

  /**
   * Create a new document
   */
  async create(
    payload: CreateOptions<DOCUMENT_TYPE>,
  ): Promise<DOCUMENT_TYPE | Record<string, any>> {
    // Apply key mapping
    let processedData = this.applyKeyMapping(payload.data);

    // Execute before hook if exists
    processedData = await this.executeBeforeHook({
      action: OperationType.CREATE,
      document: processedData,
      sessionUser: payload.sessionUser,
      executionId: payload.executionId,
    });

    // Create a document
    const document = await this.model.create(processedData);

    // Execute after hook if exists
    return this.executeAfterHook({
      action: OperationType.CREATE,
      document,
      sessionUser: payload.sessionUser,
      executionId: payload.executionId,
    });
  }

  /**
   * Update a document
   */
  async update(options: UpdateOptions<DOCUMENT_TYPE>): Promise<{
    isUpdated: boolean;
    document: DOCUMENT_TYPE | Record<string, any> | null;
  }> {
    // Convert filter if it's from the custom filter system
    const mongoFilter = buildQuery<DOCUMENT_TYPE>(
      options.where as IPersistence.Filter<DOCUMENT_TYPE>,
    );

    // Find a document to check permissions
    const previousDocument = await this.model.findOne(mongoFilter).exec();
    if (!previousDocument) {
      throw new NotFoundException('Resource not found');
    }

    // Check permission
    await this.checkPermission({
      action: OperationType.UPDATE,
      document: previousDocument,
      sessionUser: options.sessionUser,
      executionId: options.executionId,
    });

    // Apply key mapping
    let processedData = this.applyKeyMapping(options.data);

    // Execute before hook if exists
    processedData = await this.executeUpdateOrDeleteBeforeHook({
      action: OperationType.UPDATE,
      previousDocument,
      payload: processedData,
      sessionUser: options.sessionUser,
      executionId: options.executionId,
    });

    // Perform update
    const updateResult = await this.model.findOneAndUpdate(
      mongoFilter,
      processedData,
      { new: true },
    );

    // Execute after hook if exists
    const doc = await this.executeAfterHook({
      action: OperationType.UPDATE,
      document: updateResult,
      sessionUser: options.sessionUser,
      executionId: options.executionId,
    });

    return {
      isUpdated: true,
      document: doc,
    };
  }

  /**
   * Find all documents with pagination, filtering, and sorting
   */
  async findAllWithPagination(options: FindOptions<DOCUMENT_TYPE> = {}) {
    const {
      where,
      fields,
      populations,
      sessionUser,
      pagination = {},
    } = options;

    const {
      page = 1,
      limit = 10,
      sort = SortType.DESC,
      sortBy = 'createdAt',
    } = pagination;

    // Build a filter query from the new filter system with explicit type parameter
    const filterQuery = buildQuery<DOCUMENT_TYPE>(where);

    // Create a query builder and count a query
    const cursor = this.model.find(filterQuery);
    const countPromise = this.model.countDocuments(filterQuery).exec();

    // Apply field selection if provided
    if (fields?.length) {
      cursor.select(fields.join(' '));
    }

    // Apply populations if provided
    if (populations?.length) {
      this.applyPopulations(cursor, populations, fields);
    }

    // Apply sorting
    cursor.sort({ [sortBy]: sort === SortType.DESC ? -1 : 1 });

    // Apply pagination
    if (limit !== -1) {
      const skip = (page - 1) * limit;
      cursor.skip(skip).limit(limit);
    }

    // Execute queries in parallel
    const [data, count] = await Promise.all([cursor.exec(), countPromise]);

    // Apply read permission checks if needed
    const readPermissionHook = this.permissionHooks[OperationType.READ];
    let filteredData = data;

    if (readPermissionHook && sessionUser) {
      // Filter results by permission
      filteredData = [];
      for (const doc of data) {
        try {
          await this.checkPermission({
            action: OperationType.READ,
            document: doc,
            sessionUser,
            executionId: options.executionId,
          });
          filteredData.push(doc);
        } catch (e) {
          throw new ForbiddenException(
            'You do not have permission to read this resource',
          );
        }
      }
    }

    // Apply after hook if exists
    const processedData = await this.executeAfterHook({
      action: OperationType.READ,
      document: filteredData,
      sessionUser,
      executionId: options.executionId,
    });

    // Return paginated response
    return new AppPaginationResponseDto(processedData, {
      currentPage: page,
      hasNextPage: limit === -1 ? false : page * limit < count,
      totalCount: count,
      totalPages: limit === -1 ? 1 : Math.ceil(count / limit),
    });
  }

  /**
   * Find a single document
   */
  async findOne(
    options: FindOptions<DOCUMENT_TYPE> = {},
  ): Promise<DOCUMENT_TYPE | Record<string, any> | null> {
    const { fields, populations, sessionUser } = options;

    // Build a filter query from the new filter system with explicit type parameter
    const filterQuery = buildQuery<DOCUMENT_TYPE>(options.where);

    // Create a query
    const cursor = this.model.findOne(filterQuery);

    // Apply field selection if provided
    if (fields?.length) {
      cursor.select(fields.join(' '));
    }

    // Apply populations if provided
    if (populations?.length) {
      this.applyPopulations(cursor, populations, fields);
    }

    // Execute query
    const document = await cursor.exec();

    // If no document found, return null
    if (!document) {
      return null;
    }

    // Check permission
    try {
      await this.checkPermission({
        action: OperationType.READ,
        document,
        sessionUser,
        executionId: options.executionId,
      });
    } catch (e) {
      // return null; // Return null instead of error for findOne
      throw new ForbiddenException(
        'You do not have permission to read this resource',
      );
    }

    // Apply after hook if exists
    return this.executeAfterHook({
      action: OperationType.READ,
      executionId: options.executionId,
      document,
      sessionUser,
    });
  }

  /**
   * Delete a single document
   * @param options
   */
  async deleteOne(
    options: FindOptions<DOCUMENT_TYPE> = {},
  ): Promise<DOCUMENT_TYPE | Record<string, any> | null> {
    const { sessionUser } = options;

    // Build a filter query from the new filter system with explicit type parameter
    const filterQuery = buildQuery<DOCUMENT_TYPE>(options.where);

    // Create a query
    const cursor = this.model.findOne(filterQuery);

    // Execute query
    const document = await cursor.exec();

    // If no document found, return null
    if (!document) {
      return null;
    }

    // Check permission
    try {
      await this.checkPermission({
        action: OperationType.DELETE,
        document,
        sessionUser,
        executionId: options.executionId,
      });
    } catch (e) {
      // return null; // Return null instead of error for findOne
      throw new ForbiddenException(
        'You do not have permission to read this resource',
      );
    }

    const deletedDocument = await this.model
      .findOneAndDelete(filterQuery)
      .exec();

    // Apply after hook if exists
    return this.executeAfterHook({
      action: OperationType.DELETE,
      executionId: options.executionId,
      document: deletedDocument,
      sessionUser,
    });
  }

  // --------------------------------------------------------------------------------
  // Hooks Resolvers
  //--------------------------------------------------------------------------------
  /**
   * Check permission through hooks
   */
  protected async checkPermission(
    payload: PersistencePermissionCheckerPayload<DOCUMENT_TYPE>,
  ): Promise<void> {
    const permissionHook = this.permissionHooks[payload.action];
    if (!permissionHook) return;

    const hasPermission = await Promise.resolve(
      permissionHook(payload.sessionUser, payload.document),
    );

    if (!hasPermission) {
      throw new UnauthorizedException(
        `You do not have permission to ${payload.action} this resource`,
      );
    }
  }

  /**
   * Apply key mapping to transform input data
   */
  protected applyKeyMapping(data: Record<string, any>): Record<string, any> {
    if (!this.keyMapper || Object.keys(this.keyMapper).length === 0) {
      return data;
    }

    const result = { ...data };
    for (const [sourceKey, targetKey] of Object.entries(this.keyMapper)) {
      if (result[sourceKey] !== undefined) {
        result[targetKey] = result[sourceKey];
      }
    }

    return result;
  }

  /**
   * Execute before hook for an operation
   */
  protected async executeBeforeHook(
    payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
  ): Promise<DOCUMENT_TYPE | Record<string, any>> {
    const hook = this.beforeHooks[payload.action];
    if (hook) {
      return await Promise.resolve(
        hook({
          document: payload.document,
          sessionUser: payload.sessionUser,
          executionId: payload.executionId,
        }),
      );
    }
    return payload.document;
  }

  protected async executeUpdateOrDeleteBeforeHook(
    payload: PersistenceBeforeHookUpdateAndDeleteExecutePayload<DOCUMENT_TYPE>,
  ): Promise<DOCUMENT_TYPE | Record<string, any>> {
    const hook = this.beforeHooks[payload.action];

    if (hook) {
      return await Promise.resolve(
        hook({
          action: payload.action,
          previousDocument: payload.previousDocument,
          payload: payload.payload,
          sessionUser: payload.sessionUser,
          executionId: payload.executionId,
        }),
      );
    }
    return payload.payload;
  }

  /**
   * Execute after hook for an operation
   */
  protected async executeAfterHook(
    payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
  ): Promise<DOCUMENT_TYPE | Record<string, any>> {
    const hook = this.afterHooks[payload.action];

    if (hook) {
      hook({
        document: payload.document,
        sessionUser: payload.sessionUser,
        executionId: payload.executionId,
      });
    }

    return payload.document;
  }

  /**
   * Helper method to apply populations
   */
  private applyPopulations(
    cursor: mongoose.Query<any, any>,
    populations: mongoose.PopulateOptions[],
    fields?: Array<keyof DOCUMENT_TYPE>,
  ): void {
    for (const populate of populations) {
      if (
        !fields?.length ||
        (populate.path && fields.includes(populate.path as keyof DOCUMENT_TYPE))
      ) {
        cursor.populate(populate);
      }
    }
  }

  /**
   * Check if object is a filter from our custom filter system
   */
  private isFilterObject(obj: any): obj is IPersistence.Filter<any> {
    return (
      obj &&
      (('field' in obj && 'operator' in obj) || // FilterField
        ('field' in obj && ('from' in obj || 'to' in obj)) || // DateRangeFilter
        ('operator' in obj && 'filters' in obj)) // ComplexFilter
    );
  }
}
