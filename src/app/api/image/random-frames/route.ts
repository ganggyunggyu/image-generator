import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { getGoogleImageResults } from '@/shared/api/google';
import { fetchImageBuffer, convertToWebp, applyEffects } from '@/utils/image';
import { selectRandomFrame, selectRandomFilter } from '@/shared/lib/frame-filter';
import { uploadToS3, isS3Configured } from '@/shared/lib/s3';

const MAX_CONCURRENT = 5;
const MAX_COUNT = 10;
const DEFAULT_COUNT = 5;

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

interface ImageItem {
  url: string;
}

interface ResponseBody {
  images: ImageItem[];
  total: number;
  failed: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { keyword } = body;
    const count = Math.min(body.count || DEFAULT_COUNT, MAX_COUNT);

    if (!keyword) {
      return NextResponse.json({ error: 'keyword가 필요합니다' }, { status: 400, headers: corsHeaders });
    }

    const useS3 = isS3Configured();
    console.log(`🎨🚀 랜덤 액자 API!! "${keyword}" ${count}개 요청 (S3: ${useS3 ? 'ON' : 'OFF'}) 🔥💨`);

    const searchResult = await getGoogleImageResults(keyword, count * 2, 'random');

    if (!searchResult.results.length) {
      return NextResponse.json({ error: '검색 결과가 없습니다' }, { status: 404, headers: corsHeaders });
    }

    const limit = pLimit(MAX_CONCURRENT);
    const images: ImageItem[] = [];
    let failed = 0;

    const processPromises = searchResult.results.slice(0, count * 2).map((result, index) =>
      limit(async () => {
        if (images.length >= count) return null;

        try {
          const frame = selectRandomFrame();
          const filter = selectRandomFilter();

          console.log(`🖼️ ${index + 1} 처리 중... (${frame.name} + ${filter.name})`);

          const imageBuffer = await fetchImageBuffer(result.link);
          const processedBuffer = await applyEffects(imageBuffer, filter, frame);
          const webpBuffer = await convertToWebp(processedBuffer, { quality: 85 });

          let url: string;

          if (useS3) {
            const s3Result = await uploadToS3(webpBuffer, keyword, 'image/webp');
            url = s3Result.url;
          } else {
            const base64 = webpBuffer.toString('base64');
            url = `data:image/webp;base64,${base64}`;
          }

          if (images.length < count) {
            images.push({ url });
          }

          return { success: true };
        } catch (error) {
          console.error(`❌ ${index + 1} 실패:`, error);
          failed++;
          return { success: false };
        }
      })
    );

    await Promise.all(processPromises);

    console.log(`✅🎉 랜덤 액자 완료!! ${images.length}/${count}개 성공, ${failed}개 실패 🔥💯`);

    const response: ResponseBody = {
      images: images.slice(0, count),
      total: images.length,
      failed,
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
