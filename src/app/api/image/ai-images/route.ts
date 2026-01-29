import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { shuffleArrayInPlace } from '@/utils/array';
import { applyLightDistortion } from '@/utils/image';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const getS3Client = () =>
  new S3Client({
    region: process.env.AWS_S3_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

const BUCKET = process.env.AWS_S3_BUCKET || '';
const REGION = process.env.AWS_S3_REGION || 'ap-northeast-2';

const normalize = (str: string): string => {
  return str.replace(/\s+/g, '').toLowerCase().trim();
};

const findBestMatchingFolder = (keyword: string, folders: string[]): string | null => {
  const normalizedKeyword = normalize(keyword);

  // 1. 정확히 일치
  const exactMatch = folders.find((f) => normalize(f) === normalizedKeyword);
  if (exactMatch) return exactMatch;

  // 2. 키워드가 폴더명에 포함
  const containsMatch = folders.find((f) => normalize(f).includes(normalizedKeyword));
  if (containsMatch) return containsMatch;

  // 3. 폴더명이 키워드에 포함
  const reverseMatch = folders.find((f) => normalizedKeyword.includes(normalize(f)));
  if (reverseMatch) return reverseMatch;

  // 4. 부분 일치 (키워드의 앞부분이 폴더명의 앞부분과 일치)
  const partialMatch = folders.find((f) => {
    const nf = normalize(f);
    const minLen = Math.min(nf.length, normalizedKeyword.length, 5);
    return nf.slice(0, minLen) === normalizedKeyword.slice(0, minLen);
  });
  if (partialMatch) return partialMatch;

  return null;
};

const listFolders = async (prefix: string): Promise<string[]> => {
  const folders: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
      })
    );

    if (response.CommonPrefixes) {
      for (const cp of response.CommonPrefixes) {
        if (cp.Prefix) {
          const folderName = cp.Prefix.replace(prefix, '').replace('/', '');
          if (folderName) folders.push(folderName);
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return folders;
};

const listImagesInFolder = async (folder: string): Promise<string[]> => {
  const prefix = `images/${folder}/`;
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const images: string[] = [];

  const response = await getS3Client().send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 100,
    })
  );

  if (response.Contents) {
    for (const item of response.Contents) {
      const key = item.Key || '';
      if (imageExtensions.some((ext) => key.toLowerCase().endsWith(ext))) {
        images.push(`https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`);
      }
    }
  }

  return images;
};

interface ImageItem {
  url: string;
}

interface ResponseBody {
  success: boolean;
  found: boolean;
  images: ImageItem[];
  keyword: string;
  matchedFolder: string | null;
  total: number;
  failed: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const count = Math.min(parseInt(searchParams.get('count') || '5'), 20);
    const distort = searchParams.get('distort') !== 'false';

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다' },
        { status: 400, headers: corsHeaders }
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
        {
          success: true,
          found: false,
          images: [],
          keyword,
          matchedFolder: null,
          total: 0,
          failed: 0,
        },
        { headers: corsHeaders }
      );
    }

    console.log(`✅ 매칭 폴더: "${matchedFolder}"`);

    // 3. 폴더 내 이미지 가져오기
    const allImageUrls = await listImagesInFolder(matchedFolder);
    const shuffled = shuffleArrayInPlace([...allImageUrls]);
    const selected = shuffled.slice(0, count);

    console.log(`🔄 ${matchedFolder}: ${allImageUrls.length}개 중 ${selected.length}개 선택`);

    // 4. 이미지 처리 (왜곡 적용)
    const limit = pLimit(5);
    const images: ImageItem[] = [];
    let failed = 0;

    await Promise.all(
      selected.map((imageUrl) =>
        limit(async () => {
          try {
            const res = await fetch(imageUrl);
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

            const buffer = Buffer.from(await res.arrayBuffer());
            const processed = distort ? await applyLightDistortion(buffer) : buffer;
            const base64 = `data:image/webp;base64,${processed.toString('base64')}`;

            images.push({ url: base64 });
          } catch (err) {
            console.error(`❌ 처리 실패: ${imageUrl}`, err);
            failed++;
          }
        })
      )
    );

    console.log(`✅ 완료: ${images.length}개 성공, ${failed}개 실패`);

    const response: ResponseBody = {
      success: true,
      found: true,
      images,
      keyword,
      matchedFolder,
      total: images.length,
      failed,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ ai-images API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
