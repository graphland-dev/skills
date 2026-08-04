import { ISessionUser } from '@/authorization/decorators/user.decorator';
import mongoose, { Document, Model, UpdateQuery } from 'mongoose';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppPaginationResponseDto } from '@/common/dto/AppPaginationResponseDto';
import {
  buildQuery,
  IPersistence,
} from '@/common/database/persistence-query-builder';

export type PermissionHook<T> = (
  sessionUser: ISessionUser | undefined,
  document: T,
  executionId?: string,
) => boolean | Promise<boolean>;

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: SortType;
  sortBy?: string;
}

export interface UpdateOptions<T> {
  where: IPersistence.Filter<T> | IPersistence.Filter<T>[] | undefined;
  data: UpdateQuery<T>;
  sessionUser?: ISessionUser;
  executionId?: string;
}

export interface CreateOptions<T> {
  data: UpdateQuery<T>;
  sessionUser?: ISessionUser;
  executionId?: string;
}

export interface FindOptions<T> {
  fields?: Array<keyof T>;
  populations?: mongoose.PopulateOptions[];
  sessionUser?: ISessionUser;
  pagination?: PaginationOptions;
  where?: IPersistence.Filter<T> | undefined;
  executionId?: string;
}

export interface PersistenceHookCallback<T> {
  document: T | Record<string, unknown>;
  sessionUser?: ISessionUser;
  executionId?: string;
}

export interface PersistenceHookExecutePayload<T> {
  action: OperationType;
  document: T | Record<string, unknown>;
  sessionUser?: ISessionUser;
  executionId?: string;
}

export interface PersistenceBeforeHookUpdateAndDeleteExecutePayload<T> {
  action: OperationType;
  previousDocument: T;
  payload: T | Record<string, unknown>;
  sessionUser?: ISessionUser;
  executionId?: string;
}

export interface PersistencePermissionCheckerPayload<T> {
  action: OperationType;
  sessionUser?: ISessionUser;
  document: T;
  executionId?: string;
}

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface IPersistenceHookConfig<DOCUMENT_TYPE> {
  permissionHooks?: {
    [OperationType.CREATE]?: PermissionHook<DOCUMENT_TYPE>;
    [OperationType.READ]?: PermissionHook<DOCUMENT_TYPE>;
    [OperationType.UPDATE]?: PermissionHook<DOCUMENT_TYPE>;
    [OperationType.DELETE]?: PermissionHook<DOCUMENT_TYPE>;
  };
  beforeHooks?: {
    [OperationType.CREATE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<Record<string, unknown>>;
    [OperationType.UPDATE]?: (
      payload: PersistenceBeforeHookUpdateAndDeleteExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<Record<string, unknown>>;
    [OperationType.DELETE]?: (
      payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
    ) => Promise<Record<string, unknown>>;
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

@Injectable()
export abstract class PersistenceRepositoryService<
  DOCUMENT_TYPE extends Document,
> {
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
    if (hookConfig?.permissionHooks) {
      Object.assign(this.permissionHooks, hookConfig.permissionHooks);
    }

    if (hookConfig?.beforeHooks) {
      Object.assign(this.beforeHooks, hookConfig.beforeHooks);
    }

    if (hookConfig?.afterHooks) {
      Object.assign(this.afterHooks, hookConfig.afterHooks);
    }

    if (hookConfig?.keyMapper) {
      Object.assign(this.keyMapper, hookConfig.keyMapper);
    }
  }

  async create(
    payload: CreateOptions<DOCUMENT_TYPE>,
  ): Promise<DOCUMENT_TYPE | Record<string, unknown>> {
    let processedData = this.applyKeyMapping(payload.data);

    processedData = (await this.executeBeforeHook({
      action: OperationType.CREATE,
      document: processedData,
      sessionUser: payload.sessionUser,
      executionId: payload.executionId,
    })) as Record<string, unknown>;

    const document = await this.model.create(processedData as never);

    return this.executeAfterHook({
      action: OperationType.CREATE,
      document,
      sessionUser: payload.sessionUser,
      executionId: payload.executionId,
    });
  }

  async update(options: UpdateOptions<DOCUMENT_TYPE>): Promise<{
    isUpdated: boolean;
    document: DOCUMENT_TYPE | Record<string, unknown> | null;
  }> {
    const mongoFilter = buildQuery<DOCUMENT_TYPE>(
      options.where as IPersistence.Filter<DOCUMENT_TYPE>,
    );

    const previousDocument = await this.model.findOne(mongoFilter).exec();
    if (!previousDocument) {
      throw new NotFoundException('Resource not found');
    }

    await this.checkPermission({
      action: OperationType.UPDATE,
      document: previousDocument,
      sessionUser: options.sessionUser,
      executionId: options.executionId,
    });

    let processedData = this.applyKeyMapping(options.data);

    processedData = (await this.executeUpdateOrDeleteBeforeHook({
      action: OperationType.UPDATE,
      previousDocument,
      payload: processedData,
      sessionUser: options.sessionUser,
      executionId: options.executionId,
    })) as Record<string, unknown>;

    const updateResult = await this.model.findOneAndUpdate(
      mongoFilter,
      processedData,
      { returnDocument: 'after' },
    );

    const doc = this.executeAfterHook({
      action: OperationType.UPDATE,
      document: updateResult as DOCUMENT_TYPE,
      sessionUser: options.sessionUser,
      executionId: options.executionId,
    });

    return {
      isUpdated: true,
      document: doc,
    };
  }

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

    const filterQuery = buildQuery<DOCUMENT_TYPE>(where);
    const cursor = this.model.find(filterQuery);
    const countPromise = this.model.countDocuments(filterQuery).exec();

    if (fields?.length) {
      cursor.select(fields.join(' '));
    }

    if (populations?.length) {
      this.applyPopulations(cursor, populations, fields);
    }

    cursor.sort({ [sortBy]: sort === SortType.DESC ? -1 : 1 });

    if (limit !== -1) {
      const skip = (page - 1) * limit;
      cursor.skip(skip).limit(limit);
    }

    const [data, count] = await Promise.all([cursor.exec(), countPromise]);

    const readPermissionHook = this.permissionHooks[OperationType.READ];
    let filteredData = data;

    if (readPermissionHook && sessionUser) {
      filteredData = [];
      for (const doc of data) {
        await this.checkPermission({
          action: OperationType.READ,
          document: doc,
          sessionUser,
          executionId: options.executionId,
        });
        filteredData.push(doc);
      }
    }

    const processedData = this.executeAfterHook({
      action: OperationType.READ,
      document: filteredData as unknown as DOCUMENT_TYPE,
      sessionUser,
      executionId: options.executionId,
    });

    return new AppPaginationResponseDto(
      (Array.isArray(processedData)
        ? processedData
        : filteredData) as DOCUMENT_TYPE[],
      {
        currentPage: page,
        hasNextPage: limit === -1 ? false : page * limit < count,
        totalCount: count,
        totalPages: limit === -1 ? 1 : Math.ceil(count / limit),
      },
    );
  }

  async findOne(
    options: FindOptions<DOCUMENT_TYPE> = {},
  ): Promise<DOCUMENT_TYPE | Record<string, unknown> | null> {
    const { fields, populations, sessionUser } = options;
    const filterQuery = buildQuery<DOCUMENT_TYPE>(options.where);
    const cursor = this.model.findOne(filterQuery);

    if (fields?.length) {
      cursor.select(fields.join(' '));
    }

    if (populations?.length) {
      this.applyPopulations(cursor, populations, fields);
    }

    const document = await cursor.exec();

    if (!document) {
      return null;
    }

    await this.checkPermission({
      action: OperationType.READ,
      document,
      sessionUser,
      executionId: options.executionId,
    });

    return this.executeAfterHook({
      action: OperationType.READ,
      executionId: options.executionId,
      document,
      sessionUser,
    });
  }

  async deleteOne(
    options: FindOptions<DOCUMENT_TYPE> = {},
  ): Promise<DOCUMENT_TYPE | Record<string, unknown> | null> {
    const { sessionUser } = options;
    const filterQuery = buildQuery<DOCUMENT_TYPE>(options.where);
    const document = await this.model.findOne(filterQuery).exec();

    if (!document) {
      return null;
    }

    await this.checkPermission({
      action: OperationType.DELETE,
      document,
      sessionUser,
      executionId: options.executionId,
    });

    const deletedDocument = await this.model
      .findOneAndDelete(filterQuery)
      .exec();

    return this.executeAfterHook({
      action: OperationType.DELETE,
      executionId: options.executionId,
      document: deletedDocument as DOCUMENT_TYPE,
      sessionUser,
    });
  }

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

  protected applyKeyMapping(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
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

  protected async executeBeforeHook(
    payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
  ): Promise<DOCUMENT_TYPE | Record<string, unknown>> {
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
  ): Promise<DOCUMENT_TYPE | Record<string, unknown>> {
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

  protected executeAfterHook(
    payload: PersistenceHookExecutePayload<DOCUMENT_TYPE>,
  ): DOCUMENT_TYPE | Record<string, unknown> {
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

  private applyPopulations(
    cursor: mongoose.Query<unknown, unknown>,
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
}
