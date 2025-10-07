import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { DownloadOptions } from '@/shared/lib/frame-filter';

interface ProcessedBulkDownloadRequest {
  processedImages: Array<{
    url: string;
    title: string;
    width?: number;
    height?: number;
    pngUrl: string;
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

    if (body.processedImages.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: '최대 30개까지만 다운로드할 수 있습니다',
          message: 'Maximum 30 images allowed',
        },
        { status: 400 }
      );
    }

    const { frame, filter } = body.effectOptions;
    console.log(`효과 적용 일괄 다운로드: ${body.processedImages.length}개 이미지 (${frame.name} + ${filter.name})`);

    const zip = new JSZip();
    const downloadPromises = body.processedImages.map(async (imageData, index) => {
      try {
        console.log(`처리된 이미지 추가 중 ${index + 1}/${body.processedImages.length}: ${imageData.title}`);

        let imageBuffer: Buffer;

        if (imageData.processedDataUrl) {
          // 효과 적용된 데이터 URL을 Buffer로 변환
          const base64Data = imageData.processedDataUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // 효과 적용 실패한 경우 원본 사용 (이 경우는 거의 없을 것)
          console.warn(`효과 적용된 데이터가 없어 건너뜀: ${imageData.title}`);
          return {
            success: false,
            fileName: `${String(index + 1).padStart(3, '0')}_${imageData.title}_NO_EFFECT.txt`,
            originalTitle: imageData.title,
            error: '효과 적용된 데이터가 없습니다',
          };
        }

        const sanitizedTitle = imageData.title
          .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50);

        const effectSuffix = `_${frame.id}_${filter.id}`;
        const fileName = `${String(index + 1).padStart(3, '0')}_${sanitizedTitle || 'image'}${effectSuffix}.png`;

        zip.file(fileName, imageBuffer);

        return {
          success: true,
          fileName,
          originalTitle: imageData.title,
        };
      } catch (error) {
        console.error(`처리된 이미지 추가 실패 ${index + 1}: ${imageData.title}`, error);

        return {
          success: false,
          fileName: `${String(index + 1).padStart(3, '0')}_${imageData.title}_FAILED.txt`,
          originalTitle: imageData.title,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        };
      }
    });

    const results = await Promise.all(downloadPromises);

    // 실패한 항목들을 ZIP에 오류 파일로 추가
    results.forEach((result) => {
      if (!result.success) {
        const errorContent = `파일: ${result.originalTitle}\n오류: ${result.error}\n시간: ${new Date().toISOString()}`;
        zip.file(result.fileName, errorContent);
      }
    });

    console.log('ZIP 파일 생성 중...');
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`ZIP 파일 생성 완료: ${zipBuffer.length} bytes, 성공: ${successCount}, 실패: ${failedCount}`);

    const sanitizedKeyword = body.keyword
      ? body.keyword.replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '').replace(/\s+/g, '_').substring(0, 30)
      : '';

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const zipFileName = sanitizedKeyword
      ? `${sanitizedKeyword}_${frame.id}_${filter.id}_${timestamp}.zip`
      : `images_${frame.id}_${filter.id}_${timestamp}.zip`;

    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Length': zipBuffer.length.toString(),
      'Content-Disposition': `attachment; filename="${zipFileName}"`,
      'Cache-Control': 'no-cache',
      'X-Success-Count': successCount.toString(),
      'X-Failed-Count': failedCount.toString(),
    });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('효과 적용 일괄 다운로드 API 오류:', error);

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