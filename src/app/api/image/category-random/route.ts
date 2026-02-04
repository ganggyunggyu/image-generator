import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { listS3Images, isS3Configured, readS3TextFile, uploadToS3 } from '@/shared/lib/s3';
import { applyLightDistortion } from '@/utils/image';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ProductImages {
  body: string[];
  individual: string[];
  slide: string[];
  collage: string[];
  excludeLibrary: string[];
  excludeLibraryLink: string[];
}

interface Metadata {
  mapQueries?: string[];
  phone?: string;
  url?: string;
  lib_url?: string[];
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, count);
}

const emptyImages: ProductImages = {
  body: [],
  individual: [],
  slide: [],
  collage: [],
  excludeLibrary: [],
  excludeLibraryLink: [],
};

export async function GET(request: NextRequest) {
  try {
    if (!isS3Configured()) {
      return NextResponse.json(
        { error: 'S3가 설정되지 않았습니다' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const count = Math.min(parseInt(searchParams.get('count') || '5', 10) || 5, 20);
    const subfolder = searchParams.get('subfolder') || '본문';

    if (!category) {
      return NextResponse.json(
        { error: 'category 파라미터가 필요합니다' },
        { status: 400, headers: corsHeaders }
      );
    }

    const folder = `category-images/${category}/${subfolder}`;
    console.log(`🎲 랜덤 이미지 조회: ${folder} (${count}장)`);

    const allImages = await listS3Images(folder, 1000);

    if (allImages.length === 0) {
      return NextResponse.json(
        {
          images: { ...emptyImages },
          metadata: {},
          keyword: category,
          blogId: '',
          category,
          folder: '',
          total: 0,
          failed: 0,
        },
        { headers: corsHeaders }
      );
    }

    const picked = shuffleAndPick(allImages, count);
    console.log(`🎲 ${allImages.length}장 중 ${picked.length}장 선택`);

    const limit = pLimit(5);
    let failedCount = 0;

    const results = await Promise.all(
      picked.map((item, idx) =>
        limit(async () => {
          try {
            const res = await fetch(item.url);
            if (!res.ok) throw new Error(`fetch ${res.status}: ${item.key}`);

            const buffer = Buffer.from(await res.arrayBuffer());
            const processed = await applyLightDistortion(buffer);
            const { url } = await uploadToS3(processed, `category-processed/${category}`, 'image/webp');
            console.log(`✅ image_${idx + 1} 처리 완료`);
            return url;
          } catch (err) {
            console.error(`❌ image_${idx + 1} 실패:`, err);
            failedCount++;
            return null;
          }
        })
      )
    );

    const bodyImages = results.filter(Boolean) as string[];

    let metadata: Metadata = {};
    try {
      const metaJson = await readS3TextFile(`category-images/${category}/metadata.json`);
      metadata = JSON.parse(metaJson);
    } catch {
      console.log('ℹ️ metadata.json 없음');
    }

    console.log(`✅ ${folder}: ${bodyImages.length}/${picked.length}장 처리 완료`);

    return NextResponse.json(
      {
        images: { ...emptyImages, body: bodyImages },
        metadata,
        keyword: category,
        blogId: '',
        category,
        folder: category,
        total: bodyImages.length,
        failed: failedCount,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ category-random API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
