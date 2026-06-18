/**
 * api.ts
 * Shared API response envelope and error types.
 * Every Next.js API route returns ApiResponse<T>.
 */

/** Exactly 7 error codes defined in /docs/13_api_spec_part1.md. */
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'LIMIT_REACHED'
  | 'CONFLICT'
  | 'INTEGRATION_ERROR';

export interface ApiError {
  code: ErrorCode;
  message: string;
}

/**
 * Every API route returns exactly one of these two shapes:
 *   { data: T,    error: null }
 *   { data: null, error: ApiError }
 */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

/** Paginated wrapper used by list endpoints. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}
