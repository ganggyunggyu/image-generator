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
}


export interface ImageSearchResponse {
  results: ProcessedImageResult[];
  totalResults: string;
  searchTime: number;
}

export const getGoogleImageResults = async (
  query: string,
  numberOfResults: number = 10,
  sortOrder: 'original' | 'random' = 'original'
): Promise<ImageSearchResponse> => {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCseId = process.env.GOOGLE_CSE_ID;

  if (!googleApiKey) {
    throw new Error('GOOGLE_API_KEY 환경변수가 설정되지 않았습니다');
  }

  if (!googleCseId) {
    throw new Error('GOOGLE_CSE_ID 환경변수가 설정되지 않았습니다');
  }

  const allResults: ProcessedImageResult[] = [];
  let totalSearchTime = 0;
  let totalResultsCount = '0';

  // 랜덤 모드일 때는 30개 수집해서 섯기 (API 할당량 고려)
  const resultsNeeded = sortOrder === 'random' ? 30 : numberOfResults;
  const requestsNeeded = Math.ceil(resultsNeeded / 10);

  console.log(`🔍🚀 이미지 검색 요청!! "${query}" (${numberOfResults}개 요청, ${sortOrder} 순서) 🔥💨`);
  console.log(`🎲✨ ${sortOrder === 'random' ? '랜덤' : '순차'} 모드!! ${resultsNeeded}개 수집 예정, ${requestsNeeded}번 API 호출 💫`);

  const usedIndices = new Set<number>();

  try {
    for (let i = 0; i < requestsNeeded; i++) {
      // 랜덤 모드일 때는 시작 인덱스를 랜덤하게 선택
      let startIndex = i * 10 + 1;
      if (sortOrder === 'random') {
        // 각 배치마다 다른 랜덤 시작점 (1-91 사이, 3번만 호출)
        const randomStartOptions = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];
        if (randomStartOptions.length === 0) {
          throw new Error('랜덤 시작 옵션이 비어있습니다');
        }

        let attempts = 0;
        do {
          startIndex = randomStartOptions[Math.floor(Math.random() * randomStartOptions.length)]!;
          attempts++;
        } while (usedIndices.has(startIndex) && attempts < 10);

        usedIndices.add(startIndex);
        console.log(`🎲🔥 랜덤 배치!! ${i + 1}/3 startIndex=${startIndex} (시도: ${attempts}회) 💨`);
      }

      const currentBatchSize = Math.min(10, resultsNeeded - allResults.length);

      if (currentBatchSize <= 0) break;

      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.set('key', googleApiKey);
      searchUrl.searchParams.set('cx', googleCseId);
      searchUrl.searchParams.set('q', query);
      searchUrl.searchParams.set('searchType', 'image');
      searchUrl.searchParams.set('num', currentBatchSize.toString());
      searchUrl.searchParams.set('start', startIndex.toString());
      searchUrl.searchParams.set('safe', 'active');

      console.log(`🌐🚀 Google API 호출!! ${i + 1}/${requestsNeeded} (시작 인덱스: ${startIndex}, ${sortOrder} 모드) 🔥💨`);

      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageSearchBot/1.0)',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️💥 Google API 응답 오류!! (배치 ${i + 1}) 😭 ${response.status} ${response.statusText}`);

        if (i === 0) {
          throw new Error(
            `Google API 응답 오류: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
        break;
      }

      const data: GoogleSearchResponse = await response.json();

      if (i === 0) {
        totalResultsCount = data.searchInformation?.totalResults || '0';
      }
      totalSearchTime += data.searchInformation?.searchTime || 0;

      if (!data.items || data.items.length === 0) {
        console.log(`⚠️🔍 배치 ${i + 1}에서 결과 없음!! 😭`);
        break;
      }

      const batchResults: ProcessedImageResult[] = data.items
        .filter((item) => isValidImageUrl(item.link, item.mime))
        .map((item) => {
          const encodedImageUrl = encodeURIComponent(item.link);
          const imageUrl = `/api/image/proxy?src=${encodedImageUrl}`;

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
          };
        });

      allResults.push(...batchResults);
      console.log(`✅💫 배치 ${i + 1} 완료!! ${batchResults.length}개 추가 🔥 (총 ${allResults.length}개) 🎯`);

      if (allResults.length >= resultsNeeded) {
        break;
      }

      if (i < requestsNeeded - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (allResults.length === 0) {
      return {
        results: [],
        totalResults: totalResultsCount,
        searchTime: totalSearchTime,
      };
    }

    let finalResults = allResults;

    if (sortOrder === 'random') {
      shuffleArrayInPlace(finalResults);
      console.log(`🎲✨ Fisher-Yates 셔플 적용!! ${finalResults.length}개 항목 섞었다!! 🔥💨`);

      finalResults = finalResults.slice(0, numberOfResults);
    } else {
      finalResults = finalResults.slice(0, numberOfResults);
    }

    console.log(`✅🎉 Google API 성공!! 개쩐다!! 총 ${allResults.length}개 수집 → ${finalResults.length}개 반환 🔥💯🌟`);

    return {
      results: finalResults,
      totalResults: totalResultsCount,
      searchTime: totalSearchTime,
    };
  } catch (error) {
    console.error('❌💀 Google API 호출 실패!! 완전 박살났다!! 🔥😱💥', error);

    if (error instanceof Error) {
      throw new Error(`이미지 검색 실패: ${error.message}`);
    }

    throw new Error('알 수 없는 오류가 발생했습니다');
  }
};