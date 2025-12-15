/**
 * 브라우저에서 이미지 로드 가능 여부를 검증하는 유틸리티
 */

interface ImageData {
  imageUrl: string;
  previewUrl?: string;
  link?: string;
  image?: {
    thumbnailLink?: string;
  };
}

const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_BATCH_SIZE = 8;

/**
 * 단일 이미지의 로드 가능 여부를 검증
 */
export const checkImageLoadable = <T extends ImageData>(
  image: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T | null> => {
  return new Promise(resolve => {
    const candidates = [
      image.imageUrl,
      image.previewUrl,
      image.image?.thumbnailLink,
      image.link,
    ].filter(Boolean) as string[];

    const img = new window.Image();
    let timeoutId: NodeJS.Timeout | null = null;
    let currentIndex = 0;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    const tryNext = () => {
      if (currentIndex >= candidates.length) {
        cleanup();
        resolve(null);
        return;
      }

      const src = candidates[currentIndex]!;
      currentIndex += 1;

      cleanup();
      timeoutId = setTimeout(() => {
        tryNext();
      }, timeoutMs);

      img.onload = () => {
        cleanup();
        resolve(image);
      };
      img.onerror = () => {
        tryNext();
      };
      img.src = src;
    };

    tryNext();
  });
};

export interface ValidateImagesOptions {
  batchSize?: number;
  timeoutMs?: number;
}

/**
 * 이미지 배열에서 로드 가능한 이미지만 필터링
 *
 * @param images - 검증할 이미지 배열
 * @param targetCount - 목표 개수 (이 개수에 도달하면 조기 종료)
 * @param onProgress - 진행 상황 콜백
 * @param options - 검증 옵션
 * @returns 로드 가능한 이미지 배열
 */
export const validateImages = async <T extends ImageData>(
  images: T[],
  targetCount: number,
  onProgress?: (current: number, total: number) => void,
  options: ValidateImagesOptions = {}
): Promise<T[]> => {
  const { batchSize = DEFAULT_BATCH_SIZE, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const validImages: T[] = [];

  for (let i = 0; i < images.length && validImages.length < targetCount; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(image => checkImageLoadable(image, timeoutMs))
    );

    for (const result of results) {
      if (result && validImages.length < targetCount) {
        validImages.push(result);
      }
      onProgress?.(validImages.length, targetCount);
    }

    if (validImages.length >= targetCount) break;
  }

  return validImages;
};
