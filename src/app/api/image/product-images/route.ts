import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { listS3Images, isS3Configured } from '@/shared/lib/s3';
import { shuffleArrayInPlace } from '@/utils/array';
import { getProductFolder, getDefaultFolder } from '@/shared/lib/product-keywords';
import { applyLightDistortion } from '@/utils/image';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface ImageItem {
  url: string;
  key: string;
  filename: string;
}

interface ResponseBody {
  images: ImageItem[];
  keyword: string;
  folder: string;
  total: number;
  failed: number;
}

export async function GET(request: NextRequest) {
  try {
    if (!isS3Configured()) {
      return NextResponse.json(
        { error: 'S3가 설정되지 않았습니다' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const count = Math.min(parseInt(searchParams.get('count') || '5'), 20);

    const folderName = keyword ? getProductFolder(keyword) || getDefaultFolder() : getDefaultFolder();
    const folder = `product-images/${folderName}`;
    console.log(`📦 ${folder} 조회: ${count}개 요청`);

    const allImages = await listS3Images(folder, 1000);
    const shuffled = shuffleArrayInPlace([...allImages]);
    const selected = shuffled.slice(0, count);

    console.log(`🔄 ${folder}: ${allImages.length}개 중 ${selected.length}개 선택, 왜곡 처리 중...`);

    const limit = pLimit(5);
    const images: ImageItem[] = [];
    let failed = 0;

    await Promise.all(
      selected.map((item) =>
        limit(async () => {
          try {
            const res = await fetch(item.url);
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

            const buffer = Buffer.from(await res.arrayBuffer());
            const filename = item.key.split('/').pop() || '';
            const isExcluded = /^라이브러리제외_\d+/.test(filename);

            const processed = isExcluded ? buffer : await applyLightDistortion(buffer);
            const base64 = `data:image/webp;base64,${processed.toString('base64')}`;

            images.push({ url: base64, key: item.key, filename });
          } catch (err) {
            console.error(`❌ 처리 실패: ${item.key}`, err);
            failed++;
          }
        })
      )
    );

    console.log(`✅ ${folder} 완료: ${images.length}개 성공, ${failed}개 실패`);

    const response: ResponseBody = {
      images,
      keyword: keyword || folderName,
      folder: folderName,
      total: images.length,
      failed,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ product-images API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
