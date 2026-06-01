import type { PaginatedResponse } from '@/types/api';

/**
 * Utility to fetch all pages of a paginated API endpoint.
 * Useful for dropdowns, selectors, or any UI that needs the entire dataset
 * but the backend only provides paginated responses.
 */
export async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const result: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetcher(page);
    result.push(...response.content);
    hasMore = !response.last;
    page += 1;
  }

  return result;
}
