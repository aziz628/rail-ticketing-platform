// This file defines generic TypeScript interfaces for API responses and errors.

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  last: boolean;
}
