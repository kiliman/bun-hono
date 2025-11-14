/**
 * Standard API response wrapper
 * Used for consistent error handling across all endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
