import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getGoogleImageResults,
  isS3Configured,
  getRandomKeyword,
  processImages,
  translateWithGrok,
} = vi.hoisted(() => ({
  getGoogleImageResults: vi.fn(),
  isS3Configured: vi.fn(),
  getRandomKeyword: vi.fn(),
  processImages: vi.fn(),
  translateWithGrok: vi.fn(),
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

vi.mock('@/shared/lib/xai', () => ({
  translateWithGrok,
}));

import { POST } from './route';

describe('POST /api/image/keyword-frames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    isS3Configured.mockReturnValue(false);
    getRandomKeyword.mockReturnValue('fallback');
    translateWithGrok.mockResolvedValue('eye clinic');
  });

  it('한국어 키워드를 번역하고 light distortion 이미지를 반환함', async () => {
    getGoogleImageResults.mockResolvedValueOnce({
      results: [{ link: 'https://example.com/eye.webp' }],
    });
    processImages.mockResolvedValue({
      images: [{ url: 'data:image/png;base64,LIGHT' }],
      failed: 0,
    });

    const request = new Request('http://localhost/api/image/keyword-frames', {
      method: 'POST',
      body: JSON.stringify({ keyword: '안과', count: 1 }),
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
    expect(body.images.body).toEqual(['data:image/png;base64,LIGHT']);
    expect(body.keyword).toBe('안과');
    expect(body.total).toBe(1);
    expect(translateWithGrok).toHaveBeenCalledWith('안과');
    expect(processImages).toHaveBeenCalledWith(
      [{ link: 'https://example.com/eye.webp' }],
      1,
      [],
      expect.objectContaining({
        distortionLevel: 'light',
        useFilter: false,
        folderName: '안과',
      })
    );
  });

  it('keyword 누락 시 400을 반환함', async () => {
    const request = new Request('http://localhost/api/image/keyword-frames', {
      method: 'POST',
      body: JSON.stringify({ count: 1 }),
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as NextRequest;

    const response = await POST(request);
    const body = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('keyword');
  });
});
