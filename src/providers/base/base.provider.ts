import type { PaginatedResponse, PaginationParams } from "@/providers/provider.types.ts";

export abstract class BaseProvider {
  protected normalizePagination(
    pagination: PaginationParams | undefined,
    defaultPerPage: number,
    maxPerPage: number,
  ) {
    return {
      page: pagination?.page ?? 1,
      perPage: Math.min(pagination?.perPage ?? defaultPerPage, maxPerPage),
    };
  }

  protected buildPaginatedResponse<T>(
    data: T[],
    page: number,
    perPage: number,
  ): PaginatedResponse<T> {
    return {
      data,
      total: data.length,
      page,
      perPage,
      hasNextPage: data.length === perPage,
    };
  }
}
