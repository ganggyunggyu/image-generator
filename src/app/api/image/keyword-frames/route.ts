import { NextRequest, NextResponse } from 'next/server';
import { getGoogleImageResults } from '@/shared/api/google';
import { isS3Configured } from '@/shared/lib/s3';
import { getRandomKeyword } from '@/shared/lib/keywords';
import { processImages } from '@/shared/lib/image-processor';
import { translateWithGrok } from '@/shared/lib/xai';

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

interface ProductImages {
  body: string[];
  individual: string[];
  slide: string[];
  collage: string[];
  excludeLibrary: string[];
  excludeLibraryLink: string[];
}

const emptyImages: ProductImages = {
  body: [], individual: [], slide: [], collage: [], excludeLibrary: [], excludeLibraryLink: [],
};

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
    const searchKeyword = hasKorean ? await translateWithGrok(keyword) : keyword;

    const useS3 = isS3Configured();
    console.log(`🖼️ 키워드 액자 API: "${keyword}"${hasKorean ? ` → "${searchKeyword}"` : ''} ${count}개 요청 (S3: ${useS3 ? 'ON' : 'OFF'})`);

    const searchResult = await getGoogleImageResults(searchKeyword, count * SEARCH_MULTIPLIER, 'original');

    let bodyImages: string[] = [];
    let failed = 0;

    if (searchResult.results.length > 0) {
      const result = await processImages(searchResult.results, count, [], {
        useS3,
        folderName: keyword,
        useFilter: false,
        distortionLevel: 'light',
      });
      bodyImages = result.images.map((img) => img.url);
      failed = result.failed;
    }

    if (bodyImages.length < count) {
      const remaining = count - bodyImages.length;
      console.log(`⚠️ 결과 부족 (${bodyImages.length}/${count}), 랜덤 키워드로 ${remaining}개 보충`);

      const fallbackKeyword = getRandomKeyword();
      const fallbackResult = await getGoogleImageResults(fallbackKeyword, remaining * SEARCH_MULTIPLIER, 'random');

      if (fallbackResult.results.length > 0) {
        const result = await processImages(fallbackResult.results, remaining, [], {
          useS3,
          folderName: fallbackKeyword,
          useFilter: false,
          distortionLevel: 'light',
        });
        bodyImages = [...bodyImages, ...result.images.map((img) => img.url)];
        failed += result.failed;
      }
    }

    const finalImages = bodyImages.slice(0, count);
    console.log(`✅ 키워드 액자 완료: ${finalImages.length}/${count}개 성공, ${failed}개 실패`);

    return NextResponse.json(
      {
        images: { ...emptyImages, body: finalImages },
        metadata: {},
        keyword,
        blogId: '',
        category: '',
        folder: keyword,
        total: finalImages.length,
        failed,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ 키워드 액자 API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
