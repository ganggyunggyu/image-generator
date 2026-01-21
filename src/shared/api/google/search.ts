import pLimit from 'p-limit';
import { isValidImageUrl } from '@/utils/url';
import { shuffleArrayInPlace } from '@/utils/array';
import type { GoogleSearchResponse, ProcessedImageResult, ImageSearchResponse, SortOrder } from './types';
import { getCacheKey, readCache, writeCache } from './cache';
import { filterValidImageResults } from './validation';

const RANDOM_START_POOL = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];

interface BatchResult {
  startIndex: number;
  items: ProcessedImageResult[];
  totalResults: string | undefined;
  searchTime: number;
}

const fetchBatch = async (
  query: string,
  startIndex: number,
  num: number,
  apiKey: string,
  cseId: string,
  sortOrder: SortOrder
): Promise<BatchResult> => {
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('cx', cseId);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('searchType', 'image');
  searchUrl.searchParams.set('num', num.toString());
  searchUrl.searchParams.set('start', startIndex.toString());
  searchUrl.searchParams.set('safe', 'active');

  console.log(`🌐🚀 Google API 호출!! startIndex=${startIndex}, num=${num}, ${sortOrder} 모드 🔥💨`);

  const response = await fetch(searchUrl.toString(), {
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageSearchBot/1.0)' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API 응답 오류: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: GoogleSearchResponse = await response.json();

  const items: ProcessedImageResult[] = (data.items ?? [])
    .filter((item) => isValidImageUrl(item.link, item.mime))
    .map((item) => ({
      title: item.title,
      link: item.link,
      image: {
        contextLink: item.image.contextLink,
        height: item.image.height,
        width: item.image.width,
        byteSize: item.image.byteSize,
        thumbnailLink: item.image.thumbnailLink,
      },
      imageUrl: `/api/image/proxy?src=${encodeURIComponent(item.link)}`,
      previewUrl: item.image.thumbnailLink || item.link,
    }));

  return {
    startIndex,
    items,
    totalResults: data.searchInformation?.totalResults,
    searchTime: data.searchInformation?.searchTime ?? 0,
  };
};

const calculateBatches = (
  numberOfResults: number,
  sortOrder: SortOrder
): Array<{ startIndex: number; num: number }> => {
  const baseNeeded =
    sortOrder === 'random'
      ? Math.max(numberOfResults * 2.5, numberOfResults + 30, 90)
      : Math.max(numberOfResults * 2, numberOfResults + 20, 90);

  const rawResultsNeeded = Math.ceil(baseNeeded);
  const plannedRequests = Math.ceil(rawResultsNeeded / 10);
  const maxRequests = Math.min(plannedRequests, 10);
  const resultsNeeded = Math.min(rawResultsNeeded, maxRequests * 10);

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

  return batches;
};

export const getGoogleImageResults = async (
  query: string,
  numberOfResults: number = 10,
  sortOrder: SortOrder = 'original'
): Promise<ImageSearchResponse> => {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCseId = process.env.GOOGLE_CSE_ID;
  const cacheKey = getCacheKey(query, numberOfResults, sortOrder);

  const cached = readCache(cacheKey);
  if (cached) {
    console.log(`💾 캐시 적중!! "${query}" (${numberOfResults}, ${sortOrder})`);
    return cached;
  }

  if (!googleApiKey) throw new Error('GOOGLE_API_KEY 환경변수가 설정되지 않았습니다');
  if (!googleCseId) throw new Error('GOOGLE_CSE_ID 환경변수가 설정되지 않았습니다');

  console.log(`🔍🚀 이미지 검색 요청!! "${query}" (${numberOfResults}개 요청, ${sortOrder} 순서) 🔥💨`);

  const batches = calculateBatches(numberOfResults, sortOrder);
  if (batches.length === 0) {
    return { results: [], totalResults: '0', searchTime: 0 };
  }

  const resultsNeeded = batches.reduce((sum, b) => sum + b.num, 0);
  console.log(`🎯 목표 ${resultsNeeded}개, 요청 ${batches.length}번 (batch 최대 10개)`);

  const concurrency = sortOrder === 'random' ? 2 : 3;
  const limit = pLimit(concurrency);

  try {
    const settledBatches = await Promise.allSettled(
      batches.map((batch) =>
        limit(() => fetchBatch(query, batch.startIndex, batch.num, googleApiKey, googleCseId, sortOrder))
      )
    );

    const fulfilled = settledBatches.filter(
      (result): result is PromiseFulfilledResult<BatchResult> => result.status === 'fulfilled'
    );

    if (fulfilled.length === 0) {
      const rejected = settledBatches.find((r) => r.status === 'rejected');
      if (rejected && rejected.status === 'rejected' && rejected.reason instanceof Error) {
        throw new Error(`이미지 검색 실패: ${rejected.reason.message}`);
      }
      throw new Error('이미지 검색 실패: 모든 요청이 실패했습니다');
    }

    const ordered = sortOrder === 'original'
      ? fulfilled.sort((a, b) => a.value.startIndex - b.value.startIndex)
      : fulfilled;

    const allResults: ProcessedImageResult[] = [];
    let totalSearchTime = 0;
    let totalResultsCount = '0';

    for (const batch of ordered) {
      totalSearchTime += batch.value.searchTime;
      if (totalResultsCount === '0' && batch.value.totalResults) {
        totalResultsCount = batch.value.totalResults;
      }
      allResults.push(...batch.value.items);
    }

    if (allResults.length === 0) {
      return { results: [], totalResults: totalResultsCount, searchTime: totalSearchTime };
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
    if (shouldCache) writeCache(cacheKey, payload);

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
