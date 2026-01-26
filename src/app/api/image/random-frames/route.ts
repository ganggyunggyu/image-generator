import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { getGoogleImageResults } from '@/shared/api/google';
import { fetchImageBuffer, convertToPng, applyEffects } from '@/utils/image';
import { selectRandomFrame, selectRandomFilter } from '@/shared/lib/frame-filter';
import { uploadToS3, isS3Configured } from '@/shared/lib/s3';
import { getRandomKeyword, KeywordCategory } from '@/shared/lib/keywords';

const MAX_CONCURRENT = 5;
const MAX_COUNT = 10;
const DEFAULT_COUNT = 5;
const SEARCH_MULTIPLIER = 4;
const IMAGE_WIDTH = 966;
const IMAGE_HEIGHT = 644;

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

interface ImageItem {
  url: string;
}

interface ResponseBody {
  images: ImageItem[];
  keyword: string;
  total: number;
  failed: number;
}

interface SearchResult {
  link: string;
}

// 이미지 처리 함수
const processImages = async (
  results: SearchResult[],
  targetCount: number,
  currentImages: ImageItem[],
  folderName: string,
  useS3: boolean
): Promise<{ images: ImageItem[]; failed: number }> => {
  const limit = pLimit(MAX_CONCURRENT);
  const images = [...currentImages];
  let failed = 0;

  const promises = results.map((result, index) =>
    limit(async () => {
      if (images.length >= targetCount) return null;

      try {
        const frame = selectRandomFrame();
        const filter = selectRandomFilter();

        console.log(`🖼️ ${index + 1} 처리 중... (${frame.name} + ${filter.name})`);

        const imageBuffer = await fetchImageBuffer(result.link);
        const processedBuffer = await applyEffects(imageBuffer, filter, frame, { distortion: true });
        const pngBuffer = await convertToPng(processedBuffer, {
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          quality: 9,
        });

        let url: string;
        if (useS3) {
          const s3Result = await uploadToS3(pngBuffer, folderName, 'image/png');
          url = s3Result.url;
        } else {
          const base64 = pngBuffer.toString('base64');
          url = `data:image/png;base64,${base64}`;
        }

        if (images.length < targetCount) {
          images.push({ url });
          console.log(`✅ ${images.length}/${targetCount} 완료`);
        }

        return { success: true };
      } catch (error) {
        console.error(`❌ ${index + 1} 실패:`, error);
        failed++;
        return { success: false };
      }
    })
  );

  await Promise.all(promises);
  return { images, failed };
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

    const result = await processImages(searchResult.results, count, [], searchKeyword, useS3);

    console.log(`✅🎉 랜덤 액자 완료!! ${result.images.length}/${count}개 성공, ${result.failed}개 실패 🔥💯`);

    const response: ResponseBody = {
      images: result.images.slice(0, count),
      keyword: searchKeyword,
      total: result.images.length,
      failed: result.failed,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('❌💀 랜덤 액자 API 오류!!', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
