import { describe, it, expect } from 'vitest';
import { isImageFile, filterImageFiles } from '../lib/image-filter';

describe('isImageFile', () => {
  it('이미지 확장자 판별', () => {
    expect(isImageFile('photo.png')).toBe(true);
    expect(isImageFile('photo.jpg')).toBe(true);
    expect(isImageFile('photo.jpeg')).toBe(true);
    expect(isImageFile('photo.webp')).toBe(true);
    expect(isImageFile('photo.gif')).toBe(true);
  });

  it('대소문자 무시', () => {
    expect(isImageFile('photo.PNG')).toBe(true);
    expect(isImageFile('photo.JPG')).toBe(true);
    expect(isImageFile('PHOTO.Webp')).toBe(true);
  });

  it('이미지가 아닌 파일', () => {
    expect(isImageFile('file.txt')).toBe(false);
    expect(isImageFile('.gitkeep')).toBe(false);
    expect(isImageFile('.DS_Store')).toBe(false);
    expect(isImageFile('metadata.json')).toBe(false);
  });

  it('비슷하지만 다른 확장자', () => {
    expect(isImageFile('image.jpg.bak')).toBe(false);
    expect(isImageFile('image.pngg')).toBe(false);
  });
});

describe('filterImageFiles', () => {
  it('이미지만 필터링', () => {
    const input = ['a.png', 'b.txt', 'c.jpg', 'metadata.json', 'd.webp'];
    expect(filterImageFiles(input)).toEqual(['a.png', 'c.jpg', 'd.webp']);
  });

  it('빈 배열', () => {
    expect(filterImageFiles([])).toEqual([]);
  });

  it('이미지 없는 경우', () => {
    expect(filterImageFiles(['.DS_Store', 'thumbs.db', 'readme.md'])).toEqual([]);
  });

  it('S3 키 경로도 필터링', () => {
    const keys = [
      'product-images/cat/image_1.png',
      'product-images/cat/metadata.json',
      'product-images/cat/image_2.jpg',
    ];
    expect(filterImageFiles(keys)).toEqual([
      'product-images/cat/image_1.png',
      'product-images/cat/image_2.jpg',
    ]);
  });
});
