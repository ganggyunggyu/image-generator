import { NextRequest, NextResponse } from 'next/server';
import {
  buildAiImagesResponse,
  CORS_HEADERS,
  DEFAULT_IMAGE_COUNT,
  findBestMatchingFolder,
  listFolders,
  listImagesInFolder,
  MAX_IMAGE_COUNT,
  MIN_MATCHED_FOLDER_IMAGE_COUNT,
  processAiImages,
} from './lib';
import { shuffleArrayInPlace } from '@/utils/array';
const parseCount = (rawCount: string | null): number => {
  const parsedCount = Number.parseInt(rawCount || '', 10);

  if (Number.isNaN(parsedCount) || parsedCount < 1) {
    return DEFAULT_IMAGE_COUNT;
  }

  return Math.min(parsedCount, MAX_IMAGE_COUNT);
};

export const OPTIONS = async () => NextResponse.json({}, { headers: CORS_HEADERS });

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword')?.trim() || '';
    const count = parseCount(searchParams.get('count'));
    const distort = searchParams.get('distort') !== 'false';

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log(`🔍 AI 이미지 검색: "${keyword}" (${count}개 요청)`);

    // 1. images/ 폴더 목록 가져오기
    const folders = await listFolders('images/');
    console.log(`📁 폴더 ${folders.length}개 발견`);

    // 2. 가장 비슷한 폴더 찾기
    const matchedFolder = findBestMatchingFolder(keyword, folders);

    if (!matchedFolder) {
      console.log(`❌ 매칭 폴더 없음: "${keyword}"`);
      return NextResponse.json(
        { error: '매칭되는 이미지 폴더가 없습니다', keyword },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 3. 폴더 내 이미지 가져오기
    const allImageUrls = await listImagesInFolder(matchedFolder);
    if (allImageUrls.length < MIN_MATCHED_FOLDER_IMAGE_COUNT) {
      console.log(
        `❌ 매칭 폴더 없음: "${keyword}" (후보: "${matchedFolder}", 이미지 ${allImageUrls.length}개 < ${MIN_MATCHED_FOLDER_IMAGE_COUNT}개)`
      );
      return NextResponse.json(
        { error: '이미지 수 부족', keyword, folder: matchedFolder, folderImageCount: allImageUrls.length },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    console.log(`✅ 매칭 폴더: "${matchedFolder}" (이미지 ${allImageUrls.length}개)`);

    const shuffled = shuffleArrayInPlace([...allImageUrls]);
    const selected = shuffled.slice(0, count);

    console.log(`🔄 ${matchedFolder}: ${allImageUrls.length}개 중 ${selected.length}개 선택`);

    const { bodyImages, failed } = await processAiImages({
      distort,
      imageUrls: selected,
      keyword,
    });

    console.log(`✅ 완료: ${bodyImages.length}개 성공, ${failed}개 실패`);

    return NextResponse.json(
      buildAiImagesResponse({
        bodyImages,
        failed,
        folder: matchedFolder,
        folderImageCount: allImageUrls.length,
        keyword,
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('❌ ai-images API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
