import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { listS3Images, listS3Folders, readS3TextFile, renameS3Folder, isS3Configured } from '@/shared/lib/s3';
import { resolveCategoryMetadata } from '@/shared/lib/category-metadata/resolve-category-metadata';
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
  '라이브러리제외이미지': 'excludeLibrary',
  '라이브러리제외_링크': 'excludeLibraryLink',
} as const;

type S3FolderName = keyof typeof FOLDER_MAP;
type ResponseKey = (typeof FOLDER_MAP)[S3FolderName];

const S3_FOLDERS = Object.keys(FOLDER_MAP) as S3FolderName[];
const NO_DISTORT_FOLDERS: S3FolderName[] = ['라이브러리제외', '라이브러리제외이미지', '라이브러리제외_링크'];
const CATEGORY_MODE_MAX_IMAGES = 5;
const ALIBABA_BODY_COUNT = 5;

const ALIBABA_BODY_BLOG_GROUPS: Record<string, string> = {
  weed3122: '알리바바1~3', mad1651: '알리바바1~3', chemical12568: '알리바바1~3',
  qwzx16: '알리바바1~3', '1': '알리바바1~3', '2': '알리바바1~3', '3': '알리바바1~3',
  copy11525: '알리바바4~5', individual14144: '알리바바4~5',
  '4': '알리바바4~5', '5': '알리바바4~5',
};

const normalize = (str: string): string => str.normalize('NFC').replace(/\s+/g, '').toLowerCase().trim();
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

async function loadImages(folder: string, options: { maxTotalCount?: number } = {}) {
  const { maxTotalCount } = options;
  const limit = pLimit(5);
  const images: ProductImages = { ...emptyImages, body: [], individual: [], slide: [], collage: [], excludeLibrary: [], excludeLibraryLink: [] };
  let totalCount = 0;
  let totalFailed = 0;

  for (const s3Folder of S3_FOLDERS) {
    if (maxTotalCount !== undefined && totalCount >= maxTotalCount) {
      break;
    }

    const subPath = `${folder}/${s3Folder}`;
    const items = await listS3Images(subPath, 1000);

    if (items.length === 0) continue;

    items.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

    const remainingCount = maxTotalCount === undefined ? items.length : Math.max(maxTotalCount - totalCount, 0);

    if (remainingCount === 0) {
      break;
    }

    const selectedItems = items.slice(0, remainingCount);
    console.log(`📂 ${s3Folder}: ${selectedItems.length}개 선택 (${items.length}개 발견)`);

    const responseKey: ResponseKey = FOLDER_MAP[s3Folder];
    const skipDistort = NO_DISTORT_FOLDERS.includes(s3Folder);

    const results = await Promise.all(
      selectedItems.map((item) =>
        limit(async () => {
          try {
            if (skipDistort) return item.url;

            const res = await fetch(item.url);
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

            const buffer = Buffer.from(await res.arrayBuffer());
            const processed = await applyLightDistortion(buffer);
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
    const dateCode = searchParams.get('dateCode') || '';
    const blogName = searchParams.get('blogName') || '';
    const blogId = searchParams.get('blogId') || '';
    const category = searchParams.get('category') || '';
    const manuscriptType = searchParams.get('manuscriptType') || '';

    // 알리바바 본문: blogId 그룹에 맞는 category-images에서 body 로드
    const alibabaBodyGroup = manuscriptType === 'alibaba' && blogId
      ? ALIBABA_BODY_BLOG_GROUPS[blogId.trim()] ?? null
      : null;

    // category 모드: 고정 이미지 리턴 (소진 안 됨)
    if (category) {
      const folder = `category-images/${category}`;
      console.log(`📦 카테고리 조회: ${folder}`);

      const { images, metadata, totalCount, totalFailed } = await loadImages(folder, {
        maxTotalCount: CATEGORY_MODE_MAX_IMAGES,
      });
      const resolvedMetadata = await resolveCategoryMetadata({
        category,
        keyword,
        dateCode,
        blogName,
        baseMetadata: metadata,
      });

      console.log(`✅ ${folder} 완료: ${totalCount}개 성공, ${totalFailed}개 실패`);

      const response: ResponseBody = {
        images, metadata: resolvedMetadata, keyword: '', blogId: '', category, folder: category,
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
      if (alibabaBodyGroup) {
        const bodyFolder = `category-images/${alibabaBodyGroup}/본문`;
        const bodyItems = await listS3Images(bodyFolder, 1000);

        if (bodyItems.length > 0) {
          const shuffled = [...bodyItems].sort(() => Math.random() - 0.5).slice(0, ALIBABA_BODY_COUNT);
          const limit = pLimit(5);
          let failed = 0;
          const bodyResults = await Promise.all(
            shuffled.map((item) =>
              limit(async () => {
                try {
                  const res = await fetch(item.url);
                  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
                  const buffer = Buffer.from(await res.arrayBuffer());
                  const processed = await applyLightDistortion(buffer);
                  return `data:image/webp;base64,${processed.toString('base64')}`;
                } catch {
                  failed++;
                  return null;
                }
              })
            )
          );
          const bodyImages = bodyResults.filter((r): r is string => Boolean(r));
          console.log(`🛒 알리바바 본문 단독: ${blogId} → ${alibabaBodyGroup} (${bodyImages.length}장)`);

          return NextResponse.json(
            {
              images: { ...emptyImages, body: bodyImages },
              metadata: {},
              keyword, blogId, category: '', folder: '',
              total: bodyImages.length, failed,
            } satisfies ResponseBody,
            { headers: corsHeaders }
          );
        }
      }

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

    const { images, metadata, totalCount: loadedCount, totalFailed: loadedFailed } = await loadImages(folder);
    let totalCount = loadedCount;
    let totalFailed = loadedFailed;

    if (alibabaBodyGroup) {
      const bodyFolder = `category-images/${alibabaBodyGroup}/본문`;
      const bodyItems = await listS3Images(bodyFolder, 1000);

      if (bodyItems.length > 0) {
        const shuffled = [...bodyItems].sort(() => Math.random() - 0.5).slice(0, ALIBABA_BODY_COUNT);
        const limit = pLimit(5);
        const bodyResults = await Promise.all(
          shuffled.map((item) =>
            limit(async () => {
              try {
                const res = await fetch(item.url);
                if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
                const buffer = Buffer.from(await res.arrayBuffer());
                const processed = await applyLightDistortion(buffer);
                return `data:image/webp;base64,${processed.toString('base64')}`;
              } catch {
                totalFailed++;
                return null;
              }
            })
          )
        );
        const bodyImages = bodyResults.filter((r): r is string => Boolean(r));
        totalCount = totalCount - images.body.length + bodyImages.length;
        images.body = bodyImages;
        console.log(`🛒 알리바바 본문 대체: ${blogId} → ${alibabaBodyGroup} (${bodyImages.length}장)`);
      }
    }

    console.log(`✅ ${folder} 완료: ${totalCount}개 성공, ${totalFailed}개 실패`);

    const response: ResponseBody = {
      images, metadata, keyword, blogId, category: '', folder: matchedFolder,
      total: totalCount, failed: totalFailed,
    };

    if (totalCount > 0) {
      const usedFolder = `${basePath}/_used_${matchedFolder}`;
      renameS3Folder(folder, usedFolder)
        .then((count) => console.log(`🔒 ${folder} → ${usedFolder} (${count}개 이동)`))
        .catch((renameError) => console.error('❌ rename 실패:', renameError));
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
