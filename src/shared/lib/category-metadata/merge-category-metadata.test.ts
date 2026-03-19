import { describe, expect, it } from 'vitest';
import { mergeCategoryMetadata } from '@/shared/lib/category-metadata/merge-category-metadata';

describe('mergeCategoryMetadata', () => {
  it('시트 링크가 있으면 url만 덮어씀', () => {
    const result = mergeCategoryMetadata(
      {
        mapQueries: ['통영 안과'],
        phone: '055-000-0000',
        url: 'https://m.smartstore.naver.com/base',
        lib_url: ['https://example.com/lib'],
      },
      { url: 'https://mkt.shopping.naver.com/link/utm' },
    );

    expect(result).toEqual({
      mapQueries: ['통영 안과'],
      phone: '055-000-0000',
      url: 'https://mkt.shopping.naver.com/link/utm',
      lib_url: ['https://example.com/lib'],
    });
  });

  it('시트 링크가 없으면 원본 metadata를 유지함', () => {
    const metadata = {
      mapQueries: ['통영 안과'],
      phone: '055-000-0000',
      url: 'https://m.smartstore.naver.com/base',
    };

    expect(mergeCategoryMetadata(metadata, null)).toBe(metadata);
  });
});
