import { describe, expect, it } from 'vitest';
import { buildAiImagesResponse, EMPTY_IMAGES } from '@/app/api/image/ai-images/lib/types';

describe('buildAiImagesResponse', () => {
  it('기본 응답 구조를 안정적으로 구성함', () => {
    const bodyImages = ['https://example.com/image-1.png', 'https://example.com/image-2.png'];
    const response = buildAiImagesResponse({
      bodyImages,
      failed: 1,
      folder: '한려담원',
      folderImageCount: 73,
      keyword: '한려담원 안과',
    });

    expect(response).toEqual({
      images: {
        body: bodyImages,
        individual: [],
        slide: [],
        collage: [],
        excludeLibrary: [],
        excludeLibraryLink: [],
      },
      metadata: {},
      keyword: '한려담원 안과',
      blogId: '',
      category: '',
      folder: '한려담원',
      total: 2,
      failed: 1,
      folderImageCount: 73,
    });
  });

  it('응답 이미지를 수정해도 EMPTY_IMAGES 원본은 변하지 않음', () => {
    const response = buildAiImagesResponse({
      bodyImages: ['https://example.com/image-1.png'],
      failed: 0,
      folder: '한려담원',
      folderImageCount: 50,
      keyword: '한려담원',
    });

    response.images.individual.push('https://example.com/other.png');

    expect(EMPTY_IMAGES.individual).toEqual([]);
  });
});
