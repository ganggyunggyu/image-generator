import { describe, it, expect } from 'vitest';
import { getContentType } from '../lib/content-type';

describe('getContentType', () => {
  it('png 파일', () => {
    expect(getContentType('photo.png')).toBe('image/png');
  });

  it('jpg 파일', () => {
    expect(getContentType('photo.jpg')).toBe('image/jpeg');
  });

  it('jpeg 파일', () => {
    expect(getContentType('photo.jpeg')).toBe('image/jpeg');
  });

  it('webp 파일', () => {
    expect(getContentType('photo.webp')).toBe('image/webp');
  });

  it('gif 파일', () => {
    expect(getContentType('photo.gif')).toBe('image/gif');
  });

  it('대소문자 무시', () => {
    expect(getContentType('photo.PNG')).toBe('image/png');
    expect(getContentType('photo.JPG')).toBe('image/jpeg');
    expect(getContentType('photo.WEBP')).toBe('image/webp');
  });

  it('미지원 확장자 → application/octet-stream', () => {
    expect(getContentType('file.txt')).toBe('application/octet-stream');
    expect(getContentType('data.json')).toBe('application/octet-stream');
  });

  it('확장자 없는 파일', () => {
    expect(getContentType('README')).toBe('application/octet-stream');
  });

  it('경로 포함 파일명', () => {
    expect(getContentType('/path/to/photo.png')).toBe('image/png');
    expect(getContentType('folder/sub/image.jpg')).toBe('image/jpeg');
  });
});
