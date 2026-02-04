import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { listS3Images, listS3Folders, readS3TextFile, renameS3Folder, isS3Configured } from '@/shared/lib/s3';
import { applyLightDistortion } from '@/utils/image';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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

interface ResponseBody {
  images: ProductImages;
  metadata: Metadata;
  keyword: string;
  blogId: string;
  category: string;
  folder: string;
  total: number;
  failed: number;
}

const FOLDER_MAP = {
  '본문': 'body',
  '개별': 'individual',
  '슬라이드': 'slide',
  '콜라주': 'collage',
  '라이브러리제외': 'excludeLibrary',
  '라이브러리제외_링크': 'excludeLibraryLink',
} as const;

type S3FolderName = keyof typeof FOLDER_MAP;
type ResponseKey = (typeof FOLDER_MAP)[S3FolderName];

const S3_FOLDERS = Object.keys(FOLDER_MAP) as S3FolderName[];
const NO_DISTORT_FOLDERS: S3FolderName[] = ['라이브러리제외', '라이브러리제외_링크'];

const normalize = (str: string): string => str.replace(/\s+/g, '').toLowerCase().trim();
const stripSuffix = (str: string): string => str.replace(/_\d+$/, '');

const findMatchingFolder = (keyword: string, folders: string[]): string | null => {
  const nk = normalize(keyword);

  const exact = folders.find((f) => normalize(f) === nk);
  if (exact) return exact;

  const suffixMatch = folders.find((f) => normalize(stripSuffix(f)) === nk);
  if (suffixMatch) return suffixMatch;

  const matches = folders
    .filter((f) => {
      const nf = normalize(f);
      const nfBase = normalize(stripSuffix(f));
      return nk.includes(nf) || nk.includes(nfBase);
    })
    .sort((a, b) => normalize(b).length - normalize(a).length);
  if (matches.length > 0) return matches[0]!;

  return null;
};

const emptyImages: ProductImages = {
  body: [], individual: [], slide: [], collage: [], excludeLibrary: [], excludeLibraryLink: [],
};

async function loadImages(folder: string) {
  const limit = pLimit(5);
  const images: ProductImages = { ...emptyImages, body: [], individual: [], slide: [], collage: [], excludeLibrary: [], excludeLibraryLink: [] };
  let totalCount = 0;
  let totalFailed = 0;

  for (const s3Folder of S3_FOLDERS) {
    const subPath = `${folder}/${s3Folder}`;
    const items = await listS3Images(subPath, 1000);

    if (items.length === 0) continue;

    items.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    console.log(`📂 ${s3Folder}: ${items.length}개 발견`);

    const responseKey: ResponseKey = FOLDER_MAP[s3Folder];
    const skipDistort = NO_DISTORT_FOLDERS.includes(s3Folder);

    const results = await Promise.all(
      items.map((item) =>
        limit(async () => {
          try {
            const res = await fetch(item.url);
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

            const buffer = Buffer.from(await res.arrayBuffer());
            const processed = skipDistort ? buffer : await applyLightDistortion(buffer);
            return `data:image/webp;base64,${processed.toString('base64')}`;
          } catch (err) {
            console.error(`❌ 처리 실패: ${item.key}`, err);
            totalFailed++;
            return null;
          }
        })
      )
    );

    for (const r of results) {
      if (r) {
        images[responseKey].push(r);
        totalCount++;
      }
    }
  }

  let metadata: Metadata = {};
  try {
    const metaJson = await readS3TextFile(`${folder}/metadata.json`);
    metadata = JSON.parse(metaJson);
  } catch {
    console.log('ℹ️ metadata.json 없음');
  }

  return { images, metadata, totalCount, totalFailed };
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
    const blogId = searchParams.get('blogId') || '';
    const category = searchParams.get('category') || '';

    // category 모드: 고정 이미지 리턴 (소진 안 됨)
    if (category) {
      const folder = `category-images/${category}`;
      console.log(`📦 카테고리 조회: ${folder}`);

      const { images, metadata, totalCount, totalFailed } = await loadImages(folder);

      console.log(`✅ ${folder} 완료: ${totalCount}개 성공, ${totalFailed}개 실패`);

      const response: ResponseBody = {
        images, metadata, keyword: '', blogId: '', category, folder: category,
        total: totalCount, failed: totalFailed,
      };

      return NextResponse.json(response, { headers: corsHeaders });
    }

    // keyword 모드: 매칭 후 소진
    const basePath = blogId ? `product-images/${blogId}` : 'product-images';
    const productFolders = await listS3Folders(basePath);
    console.log(`📁 ${basePath} 폴더: ${productFolders.join(', ')}`);

    const matchedFolder = keyword ? findMatchingFolder(keyword, productFolders) : null;

    if (!matchedFolder) {
      return NextResponse.json(
        {
          images: { ...emptyImages },
          metadata: {},
          keyword, blogId, category: '', folder: '',
          total: 0, failed: 0,
        } satisfies ResponseBody,
        { headers: corsHeaders }
      );
    }

    const folder = `${basePath}/${matchedFolder}`;
    console.log(`📦 ${folder} 조회 (keyword: "${keyword}"${blogId ? `, blogId: "${blogId}"` : ''} → "${matchedFolder}")`);

    const { images, metadata, totalCount, totalFailed } = await loadImages(folder);

    console.log(`✅ ${folder} 완료: ${totalCount}개 성공, ${totalFailed}개 실패`);

    const response: ResponseBody = {
      images, metadata, keyword, blogId, category: '', folder: matchedFolder,
      total: totalCount, failed: totalFailed,
    };

    if (totalCount > 0) {
      const usedFolder = `${basePath}/_used_${matchedFolder}`;
      renameS3Folder(folder, usedFolder)
        .then((cnt) => console.log(`🔒 ${folder} → ${usedFolder} (${cnt}개 이동)`))
        .catch((err) => console.error(`❌ rename 실패:`, err));
    }

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ product-images API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
