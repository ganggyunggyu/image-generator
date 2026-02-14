import { describe, it, expect } from 'vitest';
import { parsePetMetadata, parseInputMetadata, extractBlogId, extractKeyword } from '../lib/metadata-parser';

describe('parsePetMetadata', () => {
  it('전체 필드 파싱', () => {
    const content = [
      '플레이스 지도 : 강남역 맛집, 홍대 카페',
      '번호 : 010-1234-5678',
      'https://blog.naver.com/test',
    ].join('\n');

    const result = parsePetMetadata(content);

    expect(result.mapQueries).toEqual(['강남역 맛집', '홍대 카페']);
    expect(result.phone).toBe('010-1234-5678');
    expect(result.url).toBe('https://blog.naver.com/test');
    expect(result.lib_url).toEqual([]);
  });

  it('map query 여러 줄', () => {
    const content = [
      '플레이스 지도 : 서울역',
      '플레이스 지도 : 부산역, 대전역',
    ].join('\n');

    const result = parsePetMetadata(content);
    expect(result.mapQueries).toEqual(['서울역', '부산역', '대전역']);
  });

  it('번호 없음', () => {
    const content = '플레이스 지도 : 강남\nhttps://example.com';
    const result = parsePetMetadata(content);
    expect(result.phone).toBe('');
  });

  it('URL 없음', () => {
    const content = '플레이스 지도 : 강남\n번호 : 010-0000-0000';
    const result = parsePetMetadata(content);
    expect(result.url).toBe('');
  });

  it('빈 내용', () => {
    const result = parsePetMetadata('');
    expect(result).toEqual({ mapQueries: [], phone: '', url: '', lib_url: [] });
  });

  it('여러 URL → 마지막 URL 사용', () => {
    const content = [
      'https://first.com',
      'https://second.com',
    ].join('\n');

    const result = parsePetMetadata(content);
    expect(result.url).toBe('https://second.com');
  });

  it('쉼표 주변 공백 처리', () => {
    const content = '플레이스 지도 :  서울역 ,  부산역 , 대전역 ';
    const result = parsePetMetadata(content);
    expect(result.mapQueries).toEqual(['서울역', '부산역', '대전역']);
  });
});

describe('parseInputMetadata', () => {
  it('lib_url + mapQueries 파싱', () => {
    const content = [
      '제외사진 링크 삽입 영역',
      'https://smartstore.naver.com/test',
      '',
      '지도 추가 [강남역 안과]',
    ].join('\n');

    const result = parseInputMetadata(content);
    expect(result.lib_url).toEqual(['https://smartstore.naver.com/test']);
    expect(result.mapQueries).toEqual(['강남역 안과']);
    expect(result.phone).toBe('');
    expect(result.url).toBe('');
  });

  it('링크+삽입 없는 URL은 무시', () => {
    const content = [
      '일반 텍스트',
      'https://example.com',
      '지도 추가 [역삼역]',
    ].join('\n');

    const result = parseInputMetadata(content);
    expect(result.lib_url).toEqual([]);
    expect(result.mapQueries).toEqual(['역삼역']);
  });

  it('여러 lib_url', () => {
    const content = [
      '링크 삽입 1',
      'https://first.com',
      '링크 삽입 2',
      'https://second.com',
    ].join('\n');

    const result = parseInputMetadata(content);
    expect(result.lib_url).toEqual(['https://first.com', 'https://second.com']);
  });

  it('여러 지도 추가', () => {
    const content = [
      '지도 추가 [강남역 병원]',
      '지도 추가 [역삼역 병원]',
    ].join('\n');

    const result = parseInputMetadata(content);
    expect(result.mapQueries).toEqual(['강남역 병원', '역삼역 병원']);
  });

  it('빈 내용', () => {
    const result = parseInputMetadata('');
    expect(result).toEqual({ mapQueries: [], phone: '', url: '', lib_url: [] });
  });
});

describe('extractBlogId', () => {
  it('언더스코어로 분리된 마지막 부분 추출', () => {
    expect(extractBlogId('강아지_blogabc')).toBe('blogabc');
  });

  it('언더스코어 없으면 전체 반환', () => {
    expect(extractBlogId('singleword')).toBe('singleword');
  });

  it('여러 언더스코어', () => {
    expect(extractBlogId('a_b_c_blogid')).toBe('blogid');
  });
});

describe('extractKeyword', () => {
  it('숫자 접두사 + 언더스코어 제거', () => {
    expect(extractKeyword('1.강아지무료분양_blogid')).toBe('강아지무료분양');
  });

  it('숫자 접두사 없음', () => {
    expect(extractKeyword('강아지_blogid')).toBe('강아지');
  });

  it('언더스코어 없으면 전체 반환', () => {
    expect(extractKeyword('10.고양이')).toBe('고양이');
  });

  it('발행 suffix 제거', () => {
    expect(extractKeyword('3.라식라섹차이_화요일 발행')).toBe('라식라섹차이');
  });

  it('원본 키워드가 underscore 뒤에 있는 케이스', () => {
    expect(extractKeyword('1.도그마루논현_도그마루 논현')).toBe('도그마루 논현');
  });
});
