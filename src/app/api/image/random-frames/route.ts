import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import pLimit from 'p-limit';
import { getGoogleImageResults } from '@/shared/api/google';
import { fetchImageBuffer, convertToWebp, generateSanitizedFilename, sanitizeKeyword, applyEffects } from '@/utils/image';
import { selectRandomFrame, selectRandomFilter } from '@/shared/lib/frame-filter';

const MAX_CONCURRENT = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const count = Math.min(parseInt(searchParams.get('n') || '10', 10), 50);

    if (!query) {
      return NextResponse.json({ success: false, error: '검색어(q)가 필요합니다' }, { status: 400 });
    }

    console.log(`🎨🚀 랜덤 액자 API!! "${query}" ${count}개 요청 🔥💨`);

    const searchResult = await getGoogleImageResults(query, count, 'random');

    if (!searchResult.results.length) {
      return NextResponse.json({ success: false, error: '검색 결과가 없습니다' }, { status: 404 });
    }

    const zip = new JSZip();
    const limit = pLimit(MAX_CONCURRENT);

    const processPromises = searchResult.results.slice(0, count).map((result, index) =>
      limit(async () => {
        try {
          const frame = selectRandomFrame();
          const filter = selectRandomFilter();

          console.log(`🖼️ ${index + 1}/${count} 처리 중... (${frame.name} + ${filter.name})`);

          const imageBuffer = await fetchImageBuffer(result.link);
          const processedBuffer = await applyEffects(imageBuffer, filter, frame);
          const webpBuffer = await convertToWebp(processedBuffer, { quality: 92 });

          const fileName = generateSanitizedFilename({
            title: result.title,
            index,
            effectSuffix: `_${frame.id}_${filter.id}`,
          });

          zip.file(fileName, webpBuffer);

          return { success: true, fileName };
        } catch (error) {
          console.error(`❌ ${index + 1} 실패:`, error);
          return { success: false, title: result.title };
        }
      })
    );

    const results = await Promise.all(processPromises);
    const successCount = results.filter((r) => r.success).length;

    if (successCount === 0) {
      return NextResponse.json({ success: false, error: '이미지 처리 실패' }, { status: 500 });
    }

    console.log(`✅🎉 랜덤 액자 완료!! ${successCount}/${count}개 성공 🔥💯`);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const keyword = sanitizeKeyword(query);
    const fileName = `${keyword}_random_frames.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Success-Count': successCount.toString(),
        'X-Total-Count': count.toString(),
      },
    });
  } catch (error) {
    console.error('❌💀 랜덤 액자 API 오류!!', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
