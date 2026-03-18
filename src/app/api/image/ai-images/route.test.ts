import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAiImagesResponse,
  findBestMatchingFolder,
  listFolders,
  listImagesInFolder,
  processAiImages,
  shuffleArrayInPlace,
} = vi.hoisted(() => ({
  buildAiImagesResponse: vi.fn(),
  findBestMatchingFolder: vi.fn(),
  listFolders: vi.fn(),
  listImagesInFolder: vi.fn(),
  processAiImages: vi.fn(),
  shuffleArrayInPlace: vi.fn(),
}));

vi.mock('./lib', () => ({
  CORS_HEADERS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  DEFAULT_IMAGE_COUNT: 5,
  MAX_IMAGE_COUNT: 20,
  MIN_MATCHED_FOLDER_IMAGE_COUNT: 50,
  buildAiImagesResponse,
  findBestMatchingFolder,
  listFolders,
  listImagesInFolder,
  processAiImages,
}));

vi.mock('@/utils/array', () => ({
  shuffleArrayInPlace,
}));

import { GET } from './route';

describe('GET /api/image/ai-images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    listFolders.mockResolvedValue(['한려담원']);
    findBestMatchingFolder.mockReturnValue('한려담원');
    listImagesInFolder.mockResolvedValue(Array.from({ length: 60 }, (_, index) => `https://example.com/${index + 1}.webp`));
    shuffleArrayInPlace.mockImplementation((items: string[]) => items);
    processAiImages.mockResolvedValue({
      bodyImages: ['https://cdn.example.com/heavy.png'],
      failed: 0,
    });
    buildAiImagesResponse.mockImplementation(({ bodyImages, failed, folder, folderImageCount, keyword }) => ({
      images: {
        body: bodyImages,
        individual: [],
        slide: [],
        collage: [],
        excludeLibrary: [],
        excludeLibraryLink: [],
      },
      metadata: {},
      keyword,
      blogId: '',
      category: '',
      folder,
      total: bodyImages.length,
      failed,
      folderImageCount,
    }));
  });

  it('매칭된 폴더에서 이미지 응답을 반환함', async () => {
    const request = new Request(
      'http://localhost/api/image/ai-images?keyword=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90&count=1&distort=false'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      images: { body: string[] };
      folder: string;
      total: number;
      failed: number;
      folderImageCount: number;
    };

    expect(response.status).toBe(200);
    expect(body.images.body).toEqual(['https://cdn.example.com/heavy.png']);
    expect(body.folder).toBe('한려담원');
    expect(body.total).toBe(1);
    expect(processAiImages).toHaveBeenCalledWith({
      distort: false,
      imageUrls: ['https://example.com/1.webp'],
      keyword: '한려담원',
    });
  });

  it('이미지 수가 부족하면 404를 반환함', async () => {
    listImagesInFolder.mockResolvedValue(Array.from({ length: 10 }, (_, index) => `https://example.com/${index}.webp`));

    const request = new Request('http://localhost/api/image/ai-images?keyword=%ED%95%9C%EB%A0%A4%EB%8B%B4%EC%9B%90') as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as { error: string; folderImageCount: number };

    expect(response.status).toBe(404);
    expect(body.error).toContain('이미지 수 부족');
    expect(body.folderImageCount).toBe(10);
  });
});
