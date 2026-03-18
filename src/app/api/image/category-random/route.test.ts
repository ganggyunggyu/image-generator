import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listS3Images,
  isS3Configured,
  readS3TextFile,
  uploadToS3,
  applyLightDistortion,
} = vi.hoisted(() => ({
  listS3Images: vi.fn(),
  isS3Configured: vi.fn(),
  readS3TextFile: vi.fn(),
  uploadToS3: vi.fn(),
  applyLightDistortion: vi.fn(),
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

  it('category가 없으면 400을 반환함', async () => {
    const request = new Request('http://localhost/api/image/category-random') as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('category');
  });
});
