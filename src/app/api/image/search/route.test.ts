import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGoogleImageResults } = vi.hoisted(() => ({
  getGoogleImageResults: vi.fn(),
}));

vi.mock('@/lib/google', () => ({
  getGoogleImageResults,
}));

import { GET } from './route';

describe('GET /api/image/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('검색 결과를 정상 반환함', async () => {
    getGoogleImageResults.mockResolvedValue({
      results: [
        {
          title: 'sample image',
          link: 'https://example.com/sample.webp',
          imageUrl: 'https://example.com/sample.webp',
          previewUrl: 'https://example.com/sample-thumb.webp',
          width: 1200,
          height: 800,
        },
      ],
      totalResults: 1,
      searchTime: 0.12,
    });

    const request = new Request(
      'http://localhost/api/image/search?q=%EA%B0%95%EC%95%84%EC%A7%80&n=1&sortOrder=random'
    ) as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as {
      success: boolean;
      data: { query: string; results: Array<{ link: string }>; totalResults: number };
      message: string;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.query).toBe('강아지');
    expect(body.data.results[0]?.link).toBe('https://example.com/sample.webp');
    expect(body.data.totalResults).toBe(1);
    expect(body.message).toContain('1개의 이미지');
  });

  it('빈 검색어를 거부함', async () => {
    const request = new Request('http://localhost/api/image/search?q=%20%20%20') as unknown as NextRequest;

    const response = await GET(request);
    const body = await response.json() as { success: boolean; error: string };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('빈 검색어');
  });
});
