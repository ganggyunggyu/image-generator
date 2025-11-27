export interface SanitizeFilenameOptions {
  title: string;
  index: number;
  effectSuffix?: string;
  extension?: string;
  maxLength?: number;
}

export const generateSanitizedFilename = ({
  title,
  index,
  effectSuffix = '',
  extension = 'webp',
  maxLength = 50,
}: SanitizeFilenameOptions): string => {
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, maxLength);

  const indexPrefix = String(index + 1).padStart(3, '0');
  const baseName = sanitizedTitle || 'image';

  return `${indexPrefix}_${baseName}${effectSuffix}.${extension}`;
};

export const sanitizeKeyword = (keyword?: string, maxLength: number = 30): string => {
  if (!keyword) return '';

  return keyword
    .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, maxLength);
};
