import pLimit from 'p-limit';
import { isValidImageUrl } from '@/utils/url';
import { shuffleArrayInPlace } from '@/utils/array';

interface GoogleImageSearchResult {
  kind: string;
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  mime: string;
  fileFormat: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

interface GoogleSearchResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
      searchType: string;
    }>;
  };
  context: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleImageSearchResult[];
}

export interface ProcessedImageResult {
  title: string;
  link: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
  };
  imageUrl: string;
  previewUrl?: string;
}


export interface ImageSearchResponse {
  results: ProcessedImageResult[];
  totalResults: string;
  searchTime: number;
}

const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const SEARCH_CACHE_MAX = 50;
const RANDOM_START_POOL = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];

const searchCache = new Map<string, { expiresAt: number; payload: ImageSearchResponse }>();

const getCacheKey = (query: string, numberOfResults: number, sortOrder: 'original' | 'random') => {
  return `${query}::${numberOfResults}::${sortOrder}`;
};

const readCache = (key: string): ImageSearchResponse | null => {
  const cached = searchCache.get(key);

  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }

  return cached.payload;
};

const writeCache = (key: string, payload: ImageSearchResponse) => {
  if (searchCache.size >= SEARCH_CACHE_MAX) {
    searchCache.clear();
  }

  searchCache.set(key, {
    payload,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
};

const hasImageSignature = (buffer: Buffer): boolean => {
  if (buffer.length < 8) return false;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true; // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true; // PNG
  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') return true; // GIF
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true; // WebP
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) return true; // BMP
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A && buffer[3] === 0x00) ||
    (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x00 && buffer[3] === 0x2A)
  ) {
    return true; // TIFF
  }
  return false;
};

const isLikelyImageContent = async (url: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-2048',
        'Accept': 'image/webp,image/apng,image/jpeg,image/png,image/gif,image/*,*/*;q=0.5',
        'User-Agent': 'Mozilla/5.0 (compatible; ImageSearchVerifier/1.0)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) {
      return true;
    }

    if (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('application/json')) {
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

const filterValidImageResults = async (
  items: ProcessedImageResult[],
  targetCount: number
): Promise<ProcessedImageResult[]> => {
  const valid: ProcessedImageResult[] = [];
  const limit = pLimit(4);

  await Promise.all(
    items.map(item =>
      limit(async () => {
        if (valid.length >= targetCount) {
          return;
        }
        const ok = await isLikelyImageContent(item.link);
        if (ok && valid.length < targetCount) {
          valid.push(item);
        }
      })
    )
  );

  return valid.slice(0, targetCount);
};

export const getGoogleImageResults = async (
  query: string,
  numberOfResults: number = 10,
  sortOrder: 'original' | 'random' = 'original'
): Promise<ImageSearchResponse> => {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCseId = process.env.GOOGLE_CSE_ID;
  const cacheKey = getCacheKey(query, numberOfResults, sortOrder);

  const cached = readCache(cacheKey);
  if (cached) {
    console.log(`💾 캐시 적중!! "${query}" (${numberOfResults}, ${sortOrder})`);
    return cached;
  }

  if (!googleApiKey) {
    throw new Error('GOOGLE_API_KEY 환경변수가 설정되지 않았습니다');
  }

  if (!googleCseId) {
    throw new Error('GOOGLE_CSE_ID 환경변수가 설정되지 않았습니다');
  }

  const allResults: ProcessedImageResult[] = [];
  let totalSearchTime = 0;
  let totalResultsCount = '0';

  const baseNeeded = sortOrder === 'random'
    ? Math.max(numberOfResults * 2, numberOfResults + 12, 40)
    : Math.max(numberOfResults + 8, Math.ceil(numberOfResults * 1.25));
  const bufferMultiplier = sortOrder === 'random' ? 1.2 : 1.1;
  const rawResultsNeeded = Math.ceil(baseNeeded * bufferMultiplier);
  const plannedRequests = Math.ceil(rawResultsNeeded / 10);
  const maxRequests = Math.min(plannedRequests, 9);
  const resultsNeeded = Math.min(rawResultsNeeded, maxRequests * 10);

  console.log(`🔍🚀 이미지 검색 요청!! "${query}" (${numberOfResults}개 요청, ${sortOrder} 순서) 🔥💨`);
  console.log(`🎯 목표 ${resultsNeeded}개, 요청 ${maxRequests}번 (batch 최대 10개)`);

  const startIndices: number[] = [];

  if (sortOrder === 'random') {
    const shuffledPool = [...RANDOM_START_POOL];
    shuffleArrayInPlace(shuffledPool);
    for (let i = 0; i < maxRequests && i < shuffledPool.length; i++) {
      startIndices.push(shuffledPool[i]!);
    }
  } else {
    for (let i = 0; i < maxRequests; i++) {
      startIndices.push(i * 10 + 1);
    }
  }

  const batches: Array<{ startIndex: number; num: number }> = [];
  let remaining = resultsNeeded;
  for (const startIndex of startIndices) {
    if (remaining <= 0) break;
    const num = Math.min(10, remaining);
    batches.push({ startIndex, num });
    remaining -= num;
  }

  if (batches.length === 0) {
    return {
      results: [],
      totalResults: '0',
      searchTime: 0,
    };
  }

  const fetchBatch = async (startIndex: number, num: number) => {
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', googleApiKey);
    searchUrl.searchParams.set('cx', googleCseId);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('searchType', 'image');
    searchUrl.searchParams.set('num', num.toString());
    searchUrl.searchParams.set('start', startIndex.toString());
    searchUrl.searchParams.set('safe', 'active');

    console.log(`🌐🚀 Google API 호출!! startIndex=${startIndex}, num=${num}, ${sortOrder} 모드 🔥💨`);

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageSearchBot/1.0)',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API 응답 오류: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: GoogleSearchResponse = await response.json();

    const items: ProcessedImageResult[] = (data.items ?? [])
      .filter(item => isValidImageUrl(item.link, item.mime))
      .map(item => {
        const encodedImageUrl = encodeURIComponent(item.link);
        const imageUrl = `/api/image/proxy?src=${encodedImageUrl}`;
        const previewUrl = item.image.thumbnailLink || item.link;

        return {
          title: item.title,
          link: item.link,
          image: {
            contextLink: item.image.contextLink,
            height: item.image.height,
            width: item.image.width,
            byteSize: item.image.byteSize,
            thumbnailLink: item.image.thumbnailLink,
          },
          imageUrl,
          previewUrl,
        };
      });

    return {
      startIndex,
      items,
      totalResults: data.searchInformation?.totalResults,
      searchTime: data.searchInformation?.searchTime ?? 0,
    };
  };

  const concurrency = sortOrder === 'random' ? 2 : 3;
  const limit = pLimit(concurrency);

  try {
    const settledBatches = await Promise.allSettled(
      batches.map(batch => limit(() => fetchBatch(batch.startIndex, batch.num)))
    );

    const fulfilled = settledBatches.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchBatch>>> =>
        result.status === 'fulfilled'
    );

    if (fulfilled.length === 0) {
      const rejected = settledBatches.find(result => result.status === 'rejected');
      if (rejected && rejected.reason instanceof Error) {
        throw new Error(`이미지 검색 실패: ${rejected.reason.message}`);
      }
      throw new Error('이미지 검색 실패: 모든 요청이 실패했습니다');
    }

    const ordered = sortOrder === 'original'
      ? fulfilled.sort((a, b) => a.value.startIndex - b.value.startIndex)
      : fulfilled;

    for (const batch of ordered) {
      totalSearchTime += batch.value.searchTime;
      if (totalResultsCount === '0' && batch.value.totalResults) {
        totalResultsCount = batch.value.totalResults;
      }
      allResults.push(...batch.value.items);
    }

    if (allResults.length === 0) {
      return {
        results: [],
        totalResults: totalResultsCount,
        searchTime: totalSearchTime,
      };
    }

    let finalResults = sortOrder === 'random' ? shuffleArrayInPlace([...allResults]) : allResults;
    finalResults = finalResults.slice(0, resultsNeeded);

    const verifiedResults = await filterValidImageResults(finalResults, resultsNeeded);
    const chosenResults = verifiedResults.length > 0 ? verifiedResults : finalResults;

    const payload: ImageSearchResponse = {
      results: chosenResults.slice(0, resultsNeeded),
      totalResults: totalResultsCount,
      searchTime: totalSearchTime,
    };

    const shouldCache = payload.results.length >= Math.min(numberOfResults, resultsNeeded);
    if (shouldCache) {
      writeCache(cacheKey, payload);
    }

    console.log(`✅🎉 Google API 성공!! ${allResults.length}개 수집 → ${payload.results.length}개 반환 🔥💯🌟`);

    return payload;
  } catch (error) {
    console.error('❌💀 Google API 호출 실패!! 완전 박살났다!! 🔥😱💥', error);

    if (error instanceof Error) {
      throw new Error(`이미지 검색 실패: ${error.message}`);
    }

    throw new Error('알 수 없는 오류가 발생했습니다');
  }
};
