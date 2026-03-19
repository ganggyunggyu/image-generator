import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getHanryeodamwonTaggedUrl } = vi.hoisted(() => ({
  getHanryeodamwonTaggedUrl: vi.fn(),
}));

vi.mock('@/shared/lib/category-metadata/google-sheet/hanryeodamwon-blog-utm-sheet', () => ({
  getHanryeodamwonTaggedUrl,
}));

import { resolveCategoryMetadata } from '@/shared/lib/category-metadata/resolve-category-metadata';

describe('resolveCategoryMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('한려담원 키워드가 시트에 hit 되면 url을 덮어씀', async () => {
    getHanryeodamwonTaggedUrl.mockResolvedValue('https://mkt.shopping.naver.com/link/utm');

    const result = await resolveCategoryMetadata({
      category: '한려담원',
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '울릉도 흑염소',
      baseMetadata: {
        mapQueries: ['통영 안과'],
        phone: '055-000-0000',
        url: 'https://m.smartstore.naver.com/base',
      },
    });

    expect(result).toEqual({
      mapQueries: ['통영 안과'],
      phone: '055-000-0000',
      url: 'https://mkt.shopping.naver.com/link/utm',
    });
  });

  it('시트에 hit가 없으면 원본 metadata를 유지함', async () => {
    getHanryeodamwonTaggedUrl.mockResolvedValue(null);

    const result = await resolveCategoryMetadata({
      category: '한려담원',
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '없는키워드',
      baseMetadata: {
        mapQueries: ['통영 안과'],
        url: 'https://m.smartstore.naver.com/base',
      },
    });

    expect(result).toEqual({
      mapQueries: ['통영 안과'],
      url: 'https://m.smartstore.naver.com/base',
    });
  });

  it('dateCode나 blogName이 없으면 시트 조회를 하지 않음', async () => {
    const result = await resolveCategoryMetadata({
      category: '한려담원',
      keyword: '울릉도흑염소',
      baseMetadata: {
        url: 'https://m.smartstore.naver.com/base',
      },
    });

    expect(result).toEqual({
      url: 'https://m.smartstore.naver.com/base',
    });
    expect(getHanryeodamwonTaggedUrl).not.toHaveBeenCalled();
  });

  it('다른 category는 시트 조회를 하지 않음', async () => {
    const result = await resolveCategoryMetadata({
      category: '다른카테고리',
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '울릉도흑염소',
      baseMetadata: {
        url: 'https://m.smartstore.naver.com/base',
      },
    });

    expect(result).toEqual({
      url: 'https://m.smartstore.naver.com/base',
    });
    expect(getHanryeodamwonTaggedUrl).not.toHaveBeenCalled();
  });
});
