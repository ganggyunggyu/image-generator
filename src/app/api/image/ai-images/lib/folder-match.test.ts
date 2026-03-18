import { describe, expect, it } from 'vitest';
import { findBestMatchingFolder, normalizeFolderName } from '@/app/api/image/ai-images/lib/folder-match';

describe('normalizeFolderName', () => {
  it('공백과 대소문자를 정규화함', () => {
    expect(normalizeFolderName('  Han Ryeo  ')).toBe('hanryeo');
  });
});

describe('findBestMatchingFolder', () => {
  it('정확히 일치하는 폴더를 우선 반환함', () => {
    const folders = ['한려담원', '한려 담원', '다른폴더'];

    expect(findBestMatchingFolder('한려담원', folders)).toBe('한려담원');
  });

  it('키워드가 폴더명에 포함되면 매칭함', () => {
    const folders = ['한려담원 안과', '다른폴더'];

    expect(findBestMatchingFolder('담원', folders)).toBe('한려담원 안과');
  });

  it('폴더명이 키워드에 포함되면 매칭함', () => {
    const folders = ['한려담원', '다른폴더'];

    expect(findBestMatchingFolder('한려담원안과', folders)).toBe('한려담원');
  });

  it('앞부분 일부만 같아도 부분 매칭함', () => {
    const folders = ['드림케어안과후기', '다른폴더'];

    expect(findBestMatchingFolder('드림케어안약추천', folders)).toBe('드림케어안과후기');
  });

  it('빈 키워드는 매칭하지 않음', () => {
    expect(findBestMatchingFolder('   ', ['한려담원'])).toBeNull();
  });

  it('매칭 규칙이 없으면 null을 반환함', () => {
    const folders = ['강아지', '고양이'];

    expect(findBestMatchingFolder('안과', folders)).toBeNull();
  });
});
