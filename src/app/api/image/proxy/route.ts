import { NextRequest, NextResponse } from 'next/server';
import { fetchImageBuffer, convertToWebp, validateImageUrl } from '@/utils/image';

export async function GET(request: NextRequest) {
  let decodedImageUrl = '';

  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('src');
    const widthParam = searchParams.get('w');
    const heightParam = searchParams.get('h');

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: '이미지 URL(src)이 필요합니다',
          message: 'Image URL parameter "src" is required',
        },
        { status: 400 }
      );
    }

    decodedImageUrl = decodeURIComponent(imageUrl);

    if (!validateImageUrl(decodedImageUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 이미지 URL입니다',
          message: 'Invalid image URL provided',
        },
        { status: 400 }
      );
    }

    let width: number | undefined;
    let height: number | undefined;

    if (widthParam) {
      width = parseInt(widthParam, 10);
      if (isNaN(width) || width < 1 || width > 4000) {
        return NextResponse.json(
          {
            success: false,
            error: '너비는 1-4000 사이의 숫자여야 합니다',
            message: 'Width must be between 1 and 4000',
          },
          { status: 400 }
        );
      }
    }

    if (heightParam) {
      height = parseInt(heightParam, 10);
      if (isNaN(height) || height < 1 || height > 4000) {
        return NextResponse.json(
          {
            success: false,
            error: '높이는 1-4000 사이의 숫자여야 합니다',
            message: 'Height must be between 1 and 4000',
          },
          { status: 400 }
        );
      }
    }

    console.log(`🌐🚀 이미지 프록시 요청!! ${decodedImageUrl}${width || height ? ` (${width || 'auto'}x${height || 'auto'})` : ''} 🔥💨`);

    const imageBuffer = await fetchImageBuffer(decodedImageUrl);

    const webpBuffer = await convertToWebp(imageBuffer, {
      width,
      height,
      quality: 90,
    });

    const DEFAULT_CACHE_SECONDS = 3600;
    let cacheSeconds = parseInt(process.env.IMAGE_CACHE_SECONDS || String(DEFAULT_CACHE_SECONDS), 10);

    if (isNaN(cacheSeconds) || cacheSeconds < 0) {
      console.warn(`⚠️💥 Invalid IMAGE_CACHE_SECONDS: ${process.env.IMAGE_CACHE_SECONDS}, using default ${DEFAULT_CACHE_SECONDS}`);
      cacheSeconds = DEFAULT_CACHE_SECONDS;
    }

    const headers = new Headers({
      'Content-Type': 'image/webp',
      'Content-Length': webpBuffer.length.toString(),
      'Cache-Control': `public, max-age=${cacheSeconds}, immutable`,
      'X-Original-URL': decodedImageUrl,
      'X-Content-Size': webpBuffer.length.toString(),
    });

    if (width || height) {
      headers.set('X-Resized', `${width || 'auto'}x${height || 'auto'}`);
    }

    console.log(`✅🎉 WebP 프록시 성공!! 개쩐다!! ${webpBuffer.length} bytes 🔥💯🌟`);

    return new NextResponse(webpBuffer as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('❌💀 이미지 프록시 API 오류!! 완전 박살났다!! 🔥😱💥', error);
    console.error('🔗💥 요청된 URL:', decodedImageUrl);
    console.error('📜🔥 에러 스택:', error instanceof Error ? error.stack : 'Unknown error');

    let errorMessage = '이미지 처리 중 오류가 발생했습니다';
    let statusCode = 500;
    let detailedError = '';

    if (error instanceof Error) {
      detailedError = error.message;
      const message = error.message.toLowerCase();

      if (message.includes('fetch') || message.includes('network') || message.includes('연결')) {
        statusCode = 502;
        errorMessage = '원본 이미지를 가져올 수 없습니다';
      } else if (message.includes('timeout') || message.includes('시간초과')) {
        statusCode = 504;
        errorMessage = '이미지 로드 시간이 초과되었습니다';
      } else if (message.includes('format') || message.includes('형식') || message.includes('변환')) {
        statusCode = 422;
        errorMessage = '지원하지 않는 이미지 형식입니다';
      } else if (message.includes('size') || message.includes('large') || message.includes('크기')) {
        statusCode = 413;
        errorMessage = '이미지 크기가 너무 큽니다';
      } else if (message.includes('not found') || message.includes('404')) {
        statusCode = 404;
        errorMessage = '이미지를 찾을 수 없습니다';
      } else if (message.includes('html') || message.includes('콘텐츠')) {
        statusCode = 422;
        errorMessage = '이미지가 아닌 웹페이지입니다';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        detailedError: detailedError,
        requestedUrl: decodedImageUrl,
        message: 'Image proxy failed',
        timestamp: new Date().toISOString(),
      },
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}