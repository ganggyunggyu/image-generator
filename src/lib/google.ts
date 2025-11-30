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

const isValidImageUrl = (url: string, mime?: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // 1. MIME 타입 체크
    if (mime) {
      const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!validMimes.includes(mime.toLowerCase())) {
        console.log(`⚠️❌ MIME 타입 거부!! ${mime} 🚫 ${url}`);
        return false;
      }
    }

    // 2. 파일 확장자 체크
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));

    // 3. 블랙리스트 도메인 체크 (SNS 동영상 플랫폼만 차단)
    const blacklistedDomains = [
      'youtube.com',
      'youtu.be',
      'tiktok.com',
      'twitch.tv'
    ];

    const isBlacklisted = blacklistedDomains.some(domain => urlObj.hostname.includes(domain));
    if (isBlacklisted) {
      console.log(`🚫💀 블랙리스트 도메인 거부!! ${urlObj.hostname} ❌ ${url}`);
      return false;
    }

    // 4. 리다이렉트/프록시 URL만 차단
    const suspiciousPatterns = [
      'redirect.php',
      'proxy.php',
      'go.php'
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pathname.includes(pattern));
    if (hasSuspiciousPattern) {
      console.log(`⚠️🔍 의심스러운 패턴 거부!! ${pathname} 🚫 ${url}`);
      return false;
    }

    return hasValidExtension;
  } catch {
    return false;
  }
};

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

  try {
    for (let i = 0; i < requestsNeeded; i++) {
      // 랜덤 모드일 때는 시작 인덱스를 랜덤하게 선택
      let startIndex = i * 10 + 1;
      if (sortOrder === 'random') {
        // 각 배치마다 다른 랜덤 시작점 (1-91 사이, 3번만 호출)
        const randomStartOptions = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];
        startIndex = randomStartOptions[Math.floor(Math.random() * randomStartOptions.length)]!;
        console.log(`🎲🔥 랜덤 배치!! ${i + 1}/3 startIndex=${startIndex} 💨`);
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
        .filter((item) => {
          const isValid = isValidImageUrl(item.link, item.mime);
          if (!isValid) {
            console.log(`🚫❌ 이미지 URL 필터링!! ${item.title} 🔥 ${item.link}`);
          }
          return isValid;
        })
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
      for (let i = finalResults.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalResults[i], finalResults[j]] = [finalResults[j]!, finalResults[i]!];
      }
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