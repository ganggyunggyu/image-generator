import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';

vi.mock('fs');

import { listSubdirectories, listFiles, listImageFiles } from '../lib/local-fs';

const mockReaddirSync = vi.mocked(fs.readdirSync);
const mockStatSync = vi.mocked(fs.statSync);

const createStats = (isDir: boolean) =>
  ({ isDirectory: () => isDir }) as fs.Stats;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listSubdirectories', () => {
  it('디렉토리만 반환 (정렬)', () => {
    mockReaddirSync.mockReturnValue(['c_dir', 'file.txt', 'a_dir', 'b_dir'] as never);
    mockStatSync
      .mockReturnValueOnce(createStats(true))   // c_dir
      .mockReturnValueOnce(createStats(false))   // file.txt
      .mockReturnValueOnce(createStats(true))    // a_dir
      .mockReturnValueOnce(createStats(true));   // b_dir

    expect(listSubdirectories('/test')).toEqual(['a_dir', 'b_dir', 'c_dir']);
  });

  it('빈 디렉토리', () => {
    mockReaddirSync.mockReturnValue([] as never);
    expect(listSubdirectories('/empty')).toEqual([]);
  });
});

describe('listFiles', () => {
  it('파일만 반환', () => {
    mockReaddirSync.mockReturnValue(['dir1', 'file.txt', 'image.png'] as never);
    mockStatSync
      .mockReturnValueOnce(createStats(true))
      .mockReturnValueOnce(createStats(false))
      .mockReturnValueOnce(createStats(false));

    expect(listFiles('/test')).toEqual(['file.txt', 'image.png']);
  });
});

describe('listImageFiles', () => {
  it('이미지 파일만 반환', () => {
    mockReaddirSync.mockReturnValue([
      'photo.png', 'readme.md', 'cat.jpg', '.DS_Store', 'dog.webp',
    ] as never);

    expect(listImageFiles('/test')).toEqual(['photo.png', 'cat.jpg', 'dog.webp']);
  });

  it('이미지 없는 디렉토리', () => {
    mockReaddirSync.mockReturnValue(['readme.md', '.gitkeep'] as never);
    expect(listImageFiles('/test')).toEqual([]);
  });
});
