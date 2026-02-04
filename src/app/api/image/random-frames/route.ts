import { NextRequest, NextResponse } from 'next/server';
import { getGoogleImageResults } from '@/shared/api/google';
import { isS3Configured } from '@/shared/lib/s3';
import { getRandomKeyword, KeywordCategory } from '@/shared/lib/keywords';
import { processImages } from '@/shared/lib/image-processor';

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
  count?: number;
  category?: KeywordCategory;
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
    const { category } = body;
    const count = Math.min(body.count || DEFAULT_COUNT, MAX_COUNT);

    // 인기 키워드에서 랜덤 선택
    const searchKeyword = getRandomKeyword(category);

    const useS3 = isS3Configured();
    console.log(`🎨🚀 랜덤 액자 API!! "${searchKeyword}" ${count}개 요청 (S3: ${useS3 ? 'ON' : 'OFF'}) 🔥`);

    const searchResult = await getGoogleImageResults(searchKeyword, count * SEARCH_MULTIPLIER, 'random');

    if (!searchResult.results.length) {
      return NextResponse.json({ error: '검색 결과가 없습니다' }, { status: 404, headers: corsHeaders });
    }

    const result = await processImages(searchResult.results, count, [], {
      useS3,
      folderName: searchKeyword,
      useFilter: true,
      distortionLevel: 'heavy',
    });

    const bodyImages = result.images.slice(0, count).map((img) => img.url);
    console.log(`✅🎉 랜덤 액자 완료!! ${bodyImages.length}/${count}개 성공, ${result.failed}개 실패 🔥💯`);

    return NextResponse.json(
      {
        images: { ...emptyImages, body: bodyImages },
        metadata: {},
        keyword: searchKeyword,
        blogId: '',
        category: '',
        folder: searchKeyword,
        total: bodyImages.length,
        failed: result.failed,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌💀 랜덤 액자 API 오류!!', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
