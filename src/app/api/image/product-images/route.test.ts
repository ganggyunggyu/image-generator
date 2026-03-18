import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listS3Images,
  listS3Folders,
  readS3TextFile,
  renameS3Folder,
  isS3Configured,
  applyLightDistortion,
} = vi.hoisted(() => ({
  listS3Images: vi.fn(),
  listS3Folders: vi.fn(),
  readS3TextFile: vi.fn(),
  renameS3Folder: vi.fn(),
  isS3Configured: vi.fn(),
  applyLightDistortion: vi.fn(),
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
});
