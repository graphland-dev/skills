export class AppPaginationResponseDto<T> {
  data: T[];

  meta: {
    currentPage: number;
    hasNextPage: boolean;
    totalCount: number;
    totalPages: number;
  };

  constructor(
    data: T[],
    meta: {
      currentPage: number;
      hasNextPage: boolean;
      totalCount: number;
      totalPages: number;
    },
  ) {
    this.data = data;
    this.meta = meta;
  }
}
