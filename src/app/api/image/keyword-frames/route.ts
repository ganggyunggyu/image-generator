import { NextRequest, NextResponse } from 'next/server';
import { getGoogleImageResults } from '@/shared/api/google';
import { isS3Configured } from '@/shared/lib/s3';
import { getRandomKeyword } from '@/shared/lib/keywords';
import { processImages, ImageItem } from '@/shared/lib/image-processor';
import { translateToEnglish } from '@/shared/lib/translate';

const MAX_COUNT = 10;
const DEFAULT_COUNT = 5;
const SEARCH_MULTIPLIER = 4;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface RequestBody {
  keyword: string;
  count?: number;
}

interface ResponseBody {
  images: ImageItem[];
  keyword: string;
  translatedKeyword?: string;
  total: number;
  failed: number;
  usedFallback: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { keyword } = body;
    const count = Math.min(body.count || DEFAULT_COUNT, MAX_COUNT);

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'keyword는 필수입니다' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 한국어 포함 시 영어로 번역
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(keyword);
    const searchKeyword = hasKorean ? await translateToEnglish(keyword) : keyword;

    const useS3 = isS3Configured();
    console.log(`🖼️ 키워드 액자 API: "${keyword}"${hasKorean ? ` → "${searchKeyword}"` : ''} ${count}개 요청 (S3: ${useS3 ? 'ON' : 'OFF'})`);

    const searchResult = await getGoogleImageResults(searchKeyword, count * SEARCH_MULTIPLIER, 'original');

    let images: ImageItem[] = [];
    let failed = 0;
    let usedFallback = false;

    if (searchResult.results.length > 0) {
      const result = await processImages(searchResult.results, count, [], {
        useS3,
        folderName: keyword,
        useFilter: false,
        distortionLevel: 'light',
      });
      images = result.images;
      failed = result.failed;
    }

    if (images.length < count) {
      usedFallback = true;
      const remaining = count - images.length;
      console.log(`⚠️ 결과 부족 (${images.length}/${count}), 랜덤 키워드로 ${remaining}개 보충`);

      const fallbackKeyword = getRandomKeyword();
      const fallbackResult = await getGoogleImageResults(fallbackKeyword, remaining * SEARCH_MULTIPLIER, 'random');

      if (fallbackResult.results.length > 0) {
        const result = await processImages(fallbackResult.results, remaining, [], {
          useS3,
          folderName: fallbackKeyword,
          useFilter: false,
          distortionLevel: 'light',
        });
        images = [...images, ...result.images];
        failed += result.failed;
      }
    }

    console.log(`✅ 키워드 액자 완료: ${images.length}/${count}개 성공, ${failed}개 실패${usedFallback ? ' (fallback 사용)' : ''}`);

    const response: ResponseBody = {
      images: images.slice(0, count),
      keyword,
      ...(hasKorean && { translatedKeyword: searchKeyword }),
      total: images.length,
      failed,
      usedFallback,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ 키워드 액자 API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
