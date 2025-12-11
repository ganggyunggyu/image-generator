import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import pLimit from 'p-limit';
import { fetchImageBuffer, convertToWebp, generateSanitizedFilename, sanitizeKeyword } from '@/utils/image';
import { DownloadOptions } from '@/shared/lib/frame-filter';

const MAX_CONCURRENT_DOWNLOADS = 5;

interface BulkDownloadRequest {
  images: Array<{
    url: string;
    title: string;
    width?: number;
    height?: number;
  }>;
  effectOptions?: DownloadOptions;
  keyword?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkDownloadRequest = await request.json();
    const hasEffects = body.effectOptions && (body.effectOptions.frame.id !== 'none' || body.effectOptions.filter.id !== 'none');

    console.log(`📦🚀 일괄 다운로드 요청!! ${body.images.length}개 이미지 🔥💨 효과 적용: ${hasEffects ? 'Yes' : 'No'}`);
    if (hasEffects) {
      console.log(`🎨✨ 액자: ${body.effectOptions?.frame.name}, 필터: ${body.effectOptions?.filter.name} 💫`);
    }

    if (!body.images || !Array.isArray(body.images)) {
      return NextResponse.json(
        {
          success: false,
          error: '이미지 목록이 필요합니다',
          message: 'Images array is required',
        },
        { status: 400 }
      );
    }

    if (body.images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '최소 1개의 이미지가 필요합니다',
          message: 'At least one image is required',
        },
        { status: 400 }
      );
    }

    if (body.images.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: '최대 30개까지만 다운로드할 수 있습니다',
          message: 'Maximum 30 images allowed',
        },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const limit = pLimit(MAX_CONCURRENT_DOWNLOADS);

    const downloadPromises = body.images.map((imageData, index) =>
      limit(async () => {
        try {
          const decodedUrl = decodeURIComponent(imageData.url);
          console.log(`🔄✨ 이미지 처리 중!! ${index + 1}/${body.images.length} 🚀💨 ${imageData.title}${hasEffects ? ' (효과 적용)' : ''}`);

          let finalBuffer: Buffer;

          const imageBuffer = await fetchImageBuffer(decodedUrl);
          finalBuffer = await convertToWebp(imageBuffer, {
            width: imageData.width,
            height: imageData.height,
            quality: 90,
          });

          const effectSuffix = hasEffects ? `_${body.effectOptions?.frame.id}_${body.effectOptions?.filter.id}` : '';
          const fileName = generateSanitizedFilename({
            title: imageData.title,
            index,
            effectSuffix,
          });

          zip.file(fileName, finalBuffer);

          return {
            success: true,
            fileName,
            originalTitle: imageData.title,
          };
        } catch (error) {
          console.error(`❌💥 이미지 처리 실패!! ${index + 1} 😭🔥 ${imageData.title}`, error);

          return {
            success: false,
            fileName: `${String(index + 1).padStart(3, '0')}_${imageData.title}_FAILED.txt`,
            originalTitle: imageData.title,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
          };
        }
      })
    );

    const results = await Promise.all(downloadPromises);

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    if (failedCount > 0) {
      const failedList = results
        .filter(r => !r.success)
        .map(r => `${r.originalTitle}: ${r.error}`)
        .join('\n');

      zip.file('download_errors.txt',
        `다운로드 실패 목록:\n\n${failedList}\n\n실패한 이미지: ${failedCount}개\n성공한 이미지: ${successCount}개`
      );
    }

    console.log(`📦🔄 ZIP 생성 시작!! 성공: ${successCount}개, 실패: ${failedCount}개 🚀💨`);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });

    const sanitizedKeyword = sanitizeKeyword(body.keyword);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const zipFileName = sanitizedKeyword ? `${sanitizedKeyword}.zip` : `images_${timestamp}.zip`;
    const asciiSafeZipName = zipFileName.replace(/[^\x20-\x7E]/g, '_') || 'images.zip';
    const contentDisposition = `attachment; filename="${asciiSafeZipName}"; filename*=UTF-8''${encodeURIComponent(zipFileName)}`;

    console.log(`✅🎉 ZIP 생성 완료!! 개쩐다!! 🔥💯 ${zipBuffer.length} bytes 🌟`);

    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': contentDisposition,
      'Content-Length': zipBuffer.length.toString(),
      'X-Success-Count': successCount.toString(),
      'X-Failed-Count': failedCount.toString(),
      'X-Total-Count': body.images.length.toString(),
    });

    return new NextResponse(zipBuffer as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('❌💀 일괄 다운로드 API 오류!! 완전 박살났다!! 🔥😱💥', error);

    let errorMessage = '일괄 다운로드 중 오류가 발생했습니다';
    let statusCode = 500;

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('memory') || message.includes('메모리')) {
        statusCode = 413;
        errorMessage = '요청이 너무 큽니다. 이미지 개수를 줄여주세요';
      } else if (message.includes('timeout') || message.includes('시간초과')) {
        statusCode = 504;
        errorMessage = '처리 시간이 초과되었습니다. 다시 시도해주세요';
      } else if (message.includes('network') || message.includes('연결')) {
        statusCode = 502;
        errorMessage = '네트워크 오류가 발생했습니다';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Bulk download failed',
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
