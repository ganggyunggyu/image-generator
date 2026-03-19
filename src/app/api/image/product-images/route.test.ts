import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listS3Images,
  listS3Folders,
  readS3TextFile,
  renameS3Folder,
  isS3Configured,
  applyLightDistortion,
  resolveCategoryMetadata,
} = vi.hoisted(() => ({
  listS3Images: vi.fn(),
  listS3Folders: vi.fn(),
  readS3TextFile: vi.fn(),
  renameS3Folder: vi.fn(),
  isS3Configured: vi.fn(),
  applyLightDistortion: vi.fn(),
  resolveCategoryMetadata: vi.fn(),
}));

vi.mock('@/shared/lib/s3', () => ({
  listS3Images,
  listS3Folders,
  readS3TextFile,
  renameS3Folder,
  isS3Configured,
}));

vi.mock('@/utils/image', () => ({
  applyLightDistortion,
}));

vi.mock('@/shared/lib/category-metadata/resolve-category-metadata', () => ({
  resolveCategoryMetadata,
}));

import { GET } from './route';

describe('GET /api/image/product-images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    isS3Configured.mockReturnValue(true);
    listS3Folders.mockResolvedValue(['한려담원_1']);
    listS3Images.mockImplementation(async (folder: string) => {
      if (folder.endsWith('/본문')) {
        return [{ url: 'https://example.com/body.webp', key: `${folder}/image_1.webp` }];
      }

      if (folder.endsWith('/라이브러리제외')) {
        return [{ url: 'https://example.com/library.webp', key: `${folder}/image_2.webp` }];
      }

      return [];
    });
    readS3TextFile.mockResolvedValue(JSON.stringify({ mapQueries: ['통영 안과'], lib_url: ['https://example.com/lib'] }));
    renameS3Folder.mockResolvedValue(2);
    applyLightDistortion.mockResolvedValue(Buffer.from('distorted-webp'));
    resolveCategoryMetadata.mockImplementation(async ({ baseMetadata }: { baseMetadata: Record<string, unknown> }) => baseMetadata);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(Buffer.from('source-webp'), {
            status: 200,
            headers: { 'Content-Type': 'image/webp' },
          })
        )
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('키워드 매칭 결과를 타입별 이미지로 반환함', async () => {
    const request = new Request(
      'http://localhost/api/image/product-images?keyword=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&blogId=blog-a'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      images: { body: string[]; excludeLibrary: string[] };
      metadata: { mapQueries?: string[] };
      folder: string;
      total: number;
    };

    expect(response.status).toBe(200);
    expect(body.folder).toBe('한려담원_1');
    expect(body.images.body).toHaveLength(1);
    expect(body.images.body[0]?.startsWith('data:image/webp;base64,')).toBe(true);
    expect(body.images.excludeLibrary).toHaveLength(1);
    expect(body.metadata.mapQueries).toEqual(['통영 안과']);
    expect(body.total).toBe(2);
    expect(renameS3Folder).toHaveBeenCalledWith(
      'product-images/blog-a/한려담원_1',
      'product-images/blog-a/_used_한려담원_1'
    );
  });

  it('매칭 폴더가 없으면 빈 응답을 반환함', async () => {
    listS3Folders.mockResolvedValue(['다른폴더']);

    const request = new Request(
      'http://localhost/api/image/product-images?keyword=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as { folder: string; total: number; images: { body: string[] } };

    expect(response.status).toBe(200);
    expect(body.folder).toBe('');
    expect(body.total).toBe(0);
    expect(body.images.body).toEqual([]);
  });

  it('category 모드에서는 keyword를 넘겨 metadata를 보강함', async () => {
    readS3TextFile.mockResolvedValue(JSON.stringify({ mapQueries: ['통영 안과'], url: 'https://m.smartstore.naver.com/base' }));
    resolveCategoryMetadata.mockResolvedValue({
      mapQueries: ['통영 안과'],
      url: 'https://mkt.shopping.naver.com/link/utm',
    });

    const request = new Request(
      'http://localhost/api/image/product-images?category=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&keyword=%EC%9A%B8%EB%A6%89%EB%8F%84%20%ED%9D%91%EC%97%BC%EC%86%8C&dateCode=0318&blogName=%EC%A1%B0%EA%B0%81%EA%B5%AC%EB%A6%84'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      metadata: { mapQueries?: string[]; url?: string };
      category: string;
    };

    expect(response.status).toBe(200);
    expect(resolveCategoryMetadata).toHaveBeenCalledWith({
      category: '한려담원',
      keyword: '울릉도 흑염소',
      dateCode: '0318',
      blogName: '조각구름',
      baseMetadata: { mapQueries: ['통영 안과'], url: 'https://m.smartstore.naver.com/base' },
    });
    expect(body.category).toBe('한려담원');
    expect(body.metadata.url).toBe('https://mkt.shopping.naver.com/link/utm');
    expect(body.metadata.mapQueries).toEqual(['통영 안과']);
  });

  it('category 모드에서는 최대 5장까지만 반환함', async () => {
    listS3Images.mockImplementation(async (folder: string) => {
      if (folder.endsWith('/본문')) {
        return Array.from({ length: 8 }, (_, index) => ({
          url: `https://example.com/body-${index + 1}.webp`,
          key: `${folder}/image_${index + 1}.webp`,
        }));
      }

      if (folder.endsWith('/개별')) {
        return Array.from({ length: 3 }, (_, index) => ({
          url: `https://example.com/individual-${index + 1}.webp`,
          key: `${folder}/image_${index + 1}.webp`,
        }));
      }

      return [];
    });

    const request = new Request(
      'http://localhost/api/image/product-images?category=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&keyword=%ED%99%9C%EC%84%B1%EC%97%BD%EC%82%B0800&dateCode=0309&blogName=%EC%9C%88%ED%84%B0'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      images: { body: string[]; individual: string[] };
      total: number;
      failed: number;
    };

    expect(response.status).toBe(200);
    expect(body.total).toBe(5);
    expect(body.failed).toBe(0);
    expect(body.images.body).toHaveLength(5);
    expect(body.images.individual).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('category 모드에서 keyword가 미스면 원본 metadata를 유지함', async () => {
    readS3TextFile.mockResolvedValue(JSON.stringify({ mapQueries: ['통영 안과'], url: 'https://m.smartstore.naver.com/base' }));
    resolveCategoryMetadata.mockResolvedValue({
      mapQueries: ['통영 안과'],
      url: 'https://m.smartstore.naver.com/base',
    });

    const request = new Request(
      'http://localhost/api/image/product-images?category=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&keyword=%EC%97%86%EB%8A%94%ED%82%A4%EC%9B%8C%EB%93%9C&dateCode=0318&blogName=%EC%A1%B0%EA%B0%81%EA%B5%AC%EB%A6%84'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      metadata: { mapQueries?: string[]; url?: string };
    };

    expect(response.status).toBe(200);
    expect(resolveCategoryMetadata).toHaveBeenCalledWith({
      category: '한려담원',
      keyword: '없는키워드',
      dateCode: '0318',
      blogName: '조각구름',
      baseMetadata: { mapQueries: ['통영 안과'], url: 'https://m.smartstore.naver.com/base' },
    });
    expect(body.metadata).toEqual({
      mapQueries: ['통영 안과'],
      url: 'https://m.smartstore.naver.com/base',
    });
  });
});
