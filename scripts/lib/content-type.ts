import * as path from 'path';

const CONTENT_TYPE_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export const getContentType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  return CONTENT_TYPE_MAP[ext] ?? 'application/octet-stream';
};
