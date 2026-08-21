import type { ApiResponse, PaginatedMeta } from './common';

export type ApiSuccessResponse<T> = ApiResponse<T>;

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, string[]>;
}
