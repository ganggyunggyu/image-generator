import type { ImageSearchResponse, SortOrder } from './types';

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_SIZE = 50;

const searchCache = new Map<string, { expiresAt: number; payload: ImageSearchResponse }>();

export const getCacheKey = (query: string, numberOfResults: number, sortOrder: SortOrder): string => {
  return `${query}::${numberOfResults}::${sortOrder}`;
};

export const readCache = (key: string): ImageSearchResponse | null => {
  const cached = searchCache.get(key);

  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }

  return cached.payload;
};

export const writeCache = (key: string, payload: ImageSearchResponse): void => {
  if (searchCache.size >= CACHE_MAX_SIZE) {
    searchCache.clear();
  }

  searchCache.set(key, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};
