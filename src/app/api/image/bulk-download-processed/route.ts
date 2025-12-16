import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import pLimit from 'p-limit';
import { convertToWebp, generateSanitizedFilename, sanitizeKeyword } from '@/utils/image';
import { DownloadOptions } from '@/shared/lib/frame-filter';

const MAX_CONCURRENT_DOWNLOADS = 5;

interface ProcessedBulkDownloadRequest {
  processedImages: Array<{
    url: string;
    title: string;
    width?: number;
    height?: number;
    imageUrl: string;
    processedDataUrl?: string; // 효과 적용된 데이터 URL
  }>;
  effectOptions: DownloadOptions;
  keyword?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessedBulkDownloadRequest = await request.json();

    if (!body.processedImages || !Array.isArray(body.processedImages)) {
      return NextResponse.json(
        {
          success: false,
          error: '처리된 이미지 목록이 필요합니다',
          message: 'Processed images array is required',
        },
        { status: 400 }
      );
    }

    if (body.processedImages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '최소 1개의 이미지가 필요합니다',
          message: 'At least one image is required',
        },
        { status: 400 }
      );
    }

    const { frame, filter } = body.effectOptions;
    console.log(`🎨✨ 효과 적용 일괄 다운로드 시작!! ${body.processedImages.length}개 이미지 (${frame.name} + ${filter.name}) 🚀💫`);

    const zip = new JSZip();
    const limit = pLimit(MAX_CONCURRENT_DOWNLOADS);

    const downloadPromises = body.processedImages.map((imageData, index) =>
      limit(async () => {
        try {
          console.log(`📦✨ 처리된 이미지 추가 중!! ${index + 1}/${body.processedImages.length} 🔥💨 ${imageData.title}`);

          let imageBuffer: Buffer;

          if (imageData.processedDataUrl) {
            const base64Data = imageData.processedDataUrl.split(',')[1];
            if (!base64Data) {
              throw new Error('base64 데이터가 없습니다');
            }
            const originalBuffer = Buffer.from(base64Data, 'base64');

            imageBuffer = await convertToWebp(originalBuffer, {
              quality: 92,
            });
          } else {
            console.warn(`⚠️💥 효과 적용된 데이터가 없어서 건너뜀!! 😭 ${imageData.title}`);
            return {
              success: false,
              fileName: `${String(index + 1).padStart(3, '0')}_${imageData.title}_NO_EFFECT.txt`,
              originalTitle: imageData.title,
              error: '효과 적용된 데이터가 없습니다',
            };
          }

          const fileName = generateSanitizedFilename({
            title: imageData.title,
            index,
            effectSuffix: `_${frame.id}_${filter.id}`,
          });

          zip.file(fileName, imageBuffer);

          return {
            success: true,
            fileName,
            originalTitle: imageData.title,
          };
        } catch (error) {
          console.error(`❌💥 처리된 이미지 추가 실패!! 박살났다!! ${index + 1} 😭🔥 ${imageData.title}`, error);

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

    console.log('📦🔄 ZIP 파일 생성 중!! 기다려!! 🚀💫');
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`✅🎉 ZIP 파일 생성 완료!! 개쩐다!! 🔥💯 ${zipBuffer.length} bytes, 성공: ${successCount}, 실패: ${failedCount} 🌟`);

    const sanitizedKeyword = sanitizeKeyword(body.keyword);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const zipFileName = sanitizedKeyword
      ? `${sanitizedKeyword}.zip`
      : `images_${frame.id}_${filter.id}_${timestamp}.zip`;
    const asciiSafeZipName = zipFileName.replace(/[^\x20-\x7E]/g, '_') || 'images.zip';
    const contentDisposition = `attachment; filename="${asciiSafeZipName}"; filename*=UTF-8''${encodeURIComponent(zipFileName)}`;

    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Length': zipBuffer.length.toString(),
      'Content-Disposition': contentDisposition,
      'Cache-Control': 'no-cache',
      'X-Success-Count': successCount.toString(),
      'X-Failed-Count': failedCount.toString(),
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('❌💀 효과 적용 일괄 다운로드 API 오류!! 완전 박살났다!! 🔥😱💥', error);

    let errorMessage = '효과 적용 일괄 다운로드 중 오류가 발생했습니다';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('메모리') || error.message.includes('memory')) {
        statusCode = 507;
        errorMessage = '이미지 처리 중 메모리가 부족합니다';
      } else if (error.message.includes('시간초과') || error.message.includes('timeout')) {
        statusCode = 504;
        errorMessage = '이미지 처리 시간이 초과되었습니다';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Bulk download with effects failed',
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
