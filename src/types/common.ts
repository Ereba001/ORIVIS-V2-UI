export type UUID = string;
export type ISO8601DateTime = string;
export type EmailAddress = string;

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginatedMeta;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, string[]>;
}

export interface SortParam {
  field: string;
  direction: 'asc' | 'desc';
}
