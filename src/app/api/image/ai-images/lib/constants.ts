export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

export const DEFAULT_IMAGE_COUNT = 5;
export const MAX_IMAGE_COUNT = 20;
export const MAX_CONCURRENT_PROCESSES = 5;
export const MIN_MATCHED_FOLDER_IMAGE_COUNT = 50;
