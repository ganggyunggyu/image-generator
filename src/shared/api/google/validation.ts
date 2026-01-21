import pLimit from 'p-limit';
import type { ProcessedImageResult } from './types';

const hasImageSignature = (buffer: Buffer): boolean => {
  if (buffer.length < 8) return false;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;

  // GIF
  const gifHeader = buffer.toString('ascii', 0, 6);
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') return true;

  // WebP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;

  // BMP
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return true;

  // TIFF
  const isTiffLE = buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00;
  const isTiffBE = buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a;
  if (isTiffLE || isTiffBE) return true;

  return false;
};

const isLikelyImageContent = async (url: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-2048',
        Accept: 'image/webp,image/apng,image/jpeg,image/png,image/gif,image/*,*/*;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; ImageSearchVerifier/1.0)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) return true;

    if (
      contentType.includes('text/html') ||
      contentType.includes('text/plain') ||
      contentType.includes('application/json')
    ) {
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return hasImageSignature(buffer);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const filterValidImageResults = async (
  items: ProcessedImageResult[],
  targetCount: number
): Promise<ProcessedImageResult[]> => {
  const valid: ProcessedImageResult[] = [];
  const limit = pLimit(4);

  await Promise.all(
    items.map((item) =>
      limit(async () => {
        if (valid.length >= targetCount) return;

        const ok = await isLikelyImageContent(item.link);
        if (ok && valid.length < targetCount) {
          valid.push(item);
        }
      })
    )
  );

  return valid.slice(0, targetCount);
};
