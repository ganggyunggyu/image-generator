import { NextRequest, NextResponse } from 'next/server';
import { getGoogleImageResults } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const numParam = searchParams.get('n') || '10';

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: '검색어(q)가 필요합니다',
          message: 'Query parameter "q" is required',
        },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '빈 검색어는 허용되지 않습니다',
          message: 'Empty query is not allowed',
        },
        { status: 400 }
      );
    }

    const numberOfResults = parseInt(numParam, 10);

    if (isNaN(numberOfResults) || numberOfResults < 1 || numberOfResults > 30) {
      return NextResponse.json(
        {
          success: false,
          error: '결과 개수는 1-30 사이의 숫자여야 합니다',
          message: 'Number of results must be between 1 and 30',
        },
        { status: 400 }
      );
    }

    const sortOrder = searchParams.get('sortOrder') as 'original' | 'random' || 'random';

    console.log(`이미지 검색 요청: "${query}" (${numberOfResults}개, ${sortOrder} 순서)`);

    const searchResults = await getGoogleImageResults(query, numberOfResults, sortOrder);

    const response = {
      success: true,
      data: {
        query,
        results: searchResults.results,
        totalResults: searchResults.totalResults,
        searchTime: searchResults.searchTime,
        timestamp: new Date().toISOString(),
      },
      message: `${searchResults.results.length}개의 이미지를 찾았습니다`,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('이미지 검색 API 오류:', error);

    let errorMessage = '이미지 검색 중 오류가 발생했습니다';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('API 키') || error.message.includes('API_KEY')) {
        statusCode = 503;
        errorMessage = 'Google API 서비스를 사용할 수 없습니다';
      } else if (error.message.includes('할당량') || error.message.includes('quota')) {
        statusCode = 429;
        errorMessage = 'API 사용 한도를 초과했습니다';
      } else if (error.message.includes('네트워크') || error.message.includes('fetch')) {
        statusCode = 502;
        errorMessage = '외부 서비스 연결에 실패했습니다';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Image search failed',
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}