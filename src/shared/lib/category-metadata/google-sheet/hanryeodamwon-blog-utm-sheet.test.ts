import { describe, expect, it } from 'vitest';
import { findMatchingHanryeodamwonTaggedUrl } from '@/shared/lib/category-metadata/google-sheet/hanryeodamwon-blog-utm-sheet';

const createRows = (...dataRows: string[][]): string[][] => {
  return [
    [],
    [],
    [],
    [],
    [],
    [],
    ['', '구분', '웹사이트 URL', 'Source', 'Medium', 'Detail', 'Keyword', 'Campaign-Tagged URL', '비고'],
    ...dataRows,
  ];
};

describe('findMatchingHanryeodamwonTaggedUrl', () => {
  it('dateCode+blogName과 keyword 공백을 제거하고 Medium+Detail 둘 다 매칭함', () => {
    const rows = createRows([
      '',
      '1',
      'https://mkt.shopping.naver.com/link/base',
      'blog',
      '0318조각구름',
      '울릉도 흑염소',
      '인기글',
      'https://mkt.shopping.naver.com/link/base?nt_detail=%EC%9A%B8%EB%A6%89%EB%8F%84%20%ED%9D%91%EC%97%BC%EC%86%8C',
    ]);

    expect(findMatchingHanryeodamwonTaggedUrl({
      dateCode: '0318',
      blogName: '조각 구름',
      keyword: '울릉도흑염소',
    }, rows)).toBe(
      'https://mkt.shopping.naver.com/link/base?nt_detail=%EC%9A%B8%EB%A6%89%EB%8F%84%20%ED%9D%91%EC%97%BC%EC%86%8C',
    );
  });

  it('예시 행은 매칭 대상에서 제외함', () => {
    const rows = createRows([
      '예시',
      '1',
      'https://mkt.shopping.naver.com/link/base',
      'blog',
      '0318조각구름',
      '울릉도흑염소',
      '인기글',
      'https://mkt.shopping.naver.com/link/example',
    ]);

    expect(findMatchingHanryeodamwonTaggedUrl({
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '울릉도흑염소',
    }, rows)).toBeNull();
  });

  it('유효한 중복 후보가 여러 개면 가장 아래쪽 행을 선택함', () => {
    const rows = createRows(
      [
        '',
        '1',
        'https://mkt.shopping.naver.com/link/base',
        'blog',
        '0318조각구름',
        '출산후산모선물',
        '인기글',
        'https://mkt.shopping.naver.com/link/old',
      ],
      [
        '',
        '2',
        'https://mkt.shopping.naver.com/link/base',
        'blog',
        '0318조각구름',
        '출산후산모선물',
        '인기글',
        'https://mkt.shopping.naver.com/link/new',
      ],
    );

    expect(findMatchingHanryeodamwonTaggedUrl({
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '출산후산모선물',
    }, rows)).toBe(
      'https://mkt.shopping.naver.com/link/new',
    );
  });

  it('안내 문구나 오류값은 무시함', () => {
    const rows = createRows(
      [
        '',
        '1',
        'https://mkt.shopping.naver.com/link/base',
        'blog',
        '0318조각구름',
        '마가목흑염소',
        '인기글',
        '매체값을 적어주세요.',
      ],
      [
        '',
        '2',
        'https://mkt.shopping.naver.com/link/base',
        'blog',
        '0318조각구름',
        '마가목흑염소',
        '인기글',
        '#REF!',
      ],
    );

    expect(findMatchingHanryeodamwonTaggedUrl({
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '마가목흑염소',
    }, rows)).toBeNull();
  });

  it('Medium이 안 맞으면 Detail이 같아도 null을 반환함', () => {
    const rows = createRows([
      '',
      '1',
      'https://mkt.shopping.naver.com/link/base',
      'blog',
      '0318조각구름',
      '울릉도흑염소',
      '인기글',
      'https://mkt.shopping.naver.com/link/base?nt_detail=%EC%9A%B8%EB%A6%89%EB%8F%84%ED%9D%91%EC%97%BC%EC%86%8C',
    ]);

    expect(findMatchingHanryeodamwonTaggedUrl({
      dateCode: '0319',
      blogName: '조각구름',
      keyword: '울릉도흑염소',
    }, rows)).toBeNull();
  });

  it('Detail이 안 맞으면 Medium이 같아도 null을 반환함', () => {
    const rows = createRows([
      '',
      '1',
      'https://mkt.shopping.naver.com/link/base',
      'blog',
      '0318조각구름',
      '울릉도흑염소',
      '인기글',
      'https://mkt.shopping.naver.com/link/base?nt_detail=%EC%9A%B8%EB%A6%89%EB%8F%84%ED%9D%91%EC%97%BC%EC%86%8C',
    ]);

    expect(findMatchingHanryeodamwonTaggedUrl({
      dateCode: '0318',
      blogName: '조각구름',
      keyword: '없는키워드',
    }, rows)).toBeNull();
  });
});
