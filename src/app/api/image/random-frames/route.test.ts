import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getGoogleImageResults,
  isS3Configured,
  getRandomKeyword,
  processImages,
} = vi.hoisted(() => ({
  getGoogleImageResults: vi.fn(),
  isS3Configured: vi.fn(),
  getRandomKeyword: vi.fn(),
  processImages: vi.fn(),
}));

vi.mock('@/shared/api/google', () => ({
  getGoogleImageResults,
}));

vi.mock('@/shared/lib/s3', () => ({
  isS3Configured,
}));

vi.mock('@/shared/lib/keywords', () => ({
  getRandomKeyword,
}));

vi.mock('@/shared/lib/image-processor', () => ({
  processImages,
}));

import { POST } from './route';

describe('POST /api/image/random-frames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    isS3Configured.mockReturnValue(false);
    getRandomKeyword.mockReturnValue('puppy');
  });

  it('heavy distortion 이미지 응답을 반환함', async () => {
    getGoogleImageResults.mockResolvedValue({
      results: [{ link: 'https://example.com/source.webp' }],
    });
    processImages.mockResolvedValue({
      images: [{ url: 'data:image/png;base64,AAA' }],
      failed: 0,
    });

    const request = new Request('http://localhost/api/image/random-frames', {
      method: 'POST',
      body: JSON.stringify({ count: 1, category: 'animals' }),
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as NextRequest;

    const response = await POST(request);
    const body = await response.json() as {
      images: { body: string[] };
      keyword: string;
      total: number;
      failed: number;
    };

    expect(response.status).toBe(200);
    expect(body.images.body).toEqual(['data:image/png;base64,AAA']);
    expect(body.keyword).toBe('puppy');
    expect(body.total).toBe(1);
    expect(body.failed).toBe(0);
    expect(processImages).toHaveBeenCalledWith(
      [{ link: 'https://example.com/source.webp' }],
      1,
      [],
      expect.objectContaining({
        distortionLevel: 'heavy',
        useFilter: true,
        useS3: false,
      })
    );
  });

  it('검색 결과가 없으면 404를 반환함', async () => {
    getGoogleImageResults.mockResolvedValue({ results: [] });

    const request = new Request('http://localhost/api/image/random-frames', {
      method: 'POST',
      body: JSON.stringify({ count: 1 }),
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as NextRequest;

    const response = await POST(request);
    const body = await response.json() as { error: string };

    expect(response.status).toBe(404);
    expect(body.error).toContain('검색 결과');
  });
});
