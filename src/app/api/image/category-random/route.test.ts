import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listS3Images,
  isS3Configured,
  readS3TextFile,
  uploadToS3,
  applyLightDistortion,
  resolveCategoryMetadata,
} = vi.hoisted(() => ({
  listS3Images: vi.fn(),
  isS3Configured: vi.fn(),
  readS3TextFile: vi.fn(),
  uploadToS3: vi.fn(),
  applyLightDistortion: vi.fn(),
  resolveCategoryMetadata: vi.fn(),
}));

vi.mock('@/shared/lib/s3', () => ({
  listS3Images,
  isS3Configured,
  readS3TextFile,
  uploadToS3,
}));

vi.mock('@/utils/image', () => ({
  applyLightDistortion,
}));

vi.mock('@/shared/lib/category-metadata/resolve-category-metadata', () => ({
  resolveCategoryMetadata,
}));

import { GET } from './route';

describe('GET /api/image/category-random', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Math, 'random').mockReturnValue(0);
    isS3Configured.mockReturnValue(true);
    listS3Images.mockResolvedValue([
      { url: 'https://example.com/body-1.webp', key: 'body-1.webp' },
      { url: 'https://example.com/body-2.webp', key: 'body-2.webp' },
    ]);
    readS3TextFile.mockResolvedValue(JSON.stringify({ mapQueries: ['통영'], phone: '055-000-0000' }));
    uploadToS3.mockResolvedValue({ url: 'https://cdn.example.com/category.webp' });
    applyLightDistortion.mockResolvedValue(Buffer.from('distorted-image'));
    resolveCategoryMetadata.mockImplementation(async ({ baseMetadata }: { baseMetadata: Record<string, unknown> }) => baseMetadata);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(Buffer.from('source-image'), {
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

  it('카테고리 랜덤 이미지를 반환함', async () => {
    const request = new Request(
      'http://localhost/api/image/category-random?category=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&count=1&subfolder=%EB%B3%B8%EB%AC%B8'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      images: { body: string[] };
      metadata: { mapQueries?: string[]; phone?: string };
      total: number;
      failed: number;
      category: string;
    };

    expect(response.status).toBe(200);
    expect(body.images.body).toEqual(['https://cdn.example.com/category.webp']);
    expect(body.metadata.mapQueries).toEqual(['통영']);
    expect(body.metadata.phone).toBe('055-000-0000');
    expect(body.total).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.category).toBe('한려담원');
  });

  it('한려담원 category에서 keyword를 넘기면 보강된 metadata를 사용함', async () => {
    resolveCategoryMetadata.mockResolvedValue({
      mapQueries: ['통영'],
      phone: '055-000-0000',
      url: 'https://mkt.shopping.naver.com/link/utm',
    });
    const request = new Request(
      'http://localhost/api/image/category-random?category=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&keyword=%EC%9A%B8%EB%A6%89%EB%8F%84%ED%9D%91%EC%97%BC%EC%86%8C&dateCode=0318&blogName=%EC%A1%B0%EA%B0%81%EA%B5%AC%EB%A6%84&count=1&subfolder=%EB%B3%B8%EB%AC%B8'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      metadata: { mapQueries?: string[]; phone?: string; url?: string };
    };

    expect(response.status).toBe(200);
    expect(resolveCategoryMetadata).toHaveBeenCalledWith({
      category: '한려담원',
      keyword: '울릉도흑염소',
      dateCode: '0318',
      blogName: '조각구름',
      baseMetadata: { mapQueries: ['통영'], phone: '055-000-0000' },
    });
    expect(body.metadata.url).toBe('https://mkt.shopping.naver.com/link/utm');
    expect(body.metadata.mapQueries).toEqual(['통영']);
  });

  it('한려담원 category에서 keyword가 미스면 원본 metadata를 유지함', async () => {
    resolveCategoryMetadata.mockResolvedValue({
      mapQueries: ['통영'],
      phone: '055-000-0000',
      url: 'https://m.smartstore.naver.com/base',
    });
    const request = new Request(
      'http://localhost/api/image/category-random?category=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&keyword=%EC%97%86%EB%8A%94%ED%82%A4%EC%9B%8C%EB%93%9C&dateCode=0318&blogName=%EC%A1%B0%EA%B0%81%EA%B5%AC%EB%A6%84&count=1&subfolder=%EB%B3%B8%EB%AC%B8'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      metadata: { mapQueries?: string[]; phone?: string; url?: string };
    };

    expect(response.status).toBe(200);
    expect(resolveCategoryMetadata).toHaveBeenCalledWith({
      category: '한려담원',
      keyword: '없는키워드',
      dateCode: '0318',
      blogName: '조각구름',
      baseMetadata: { mapQueries: ['통영'], phone: '055-000-0000' },
    });
    expect(body.metadata).toEqual({
      mapQueries: ['통영'],
      phone: '055-000-0000',
      url: 'https://m.smartstore.naver.com/base',
    });
  });

  it('category가 없으면 400을 반환함', async () => {
    const request = new Request('http://localhost/api/image/category-random') as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('category');
  });
});
