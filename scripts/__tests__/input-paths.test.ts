import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import { findMatchingSubdirectories, resolveExistingDirectory } from '../lib/input-paths';

vi.mock('fs');

const mockExistsSync = vi.mocked(fs.existsSync);
const mockStatSync = vi.mocked(fs.statSync);
const mockReaddirSync = vi.mocked(fs.readdirSync);

const createStats = (isDir: boolean) =>
  ({ isDirectory: () => isDir }) as fs.Stats;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveExistingDirectory', () => {
  it('존재하는 첫 디렉토리를 반환함', () => {
    mockExistsSync.mockImplementation((pathLike: fs.PathLike) => pathLike.toString() === '/second');
    mockStatSync.mockReturnValue(createStats(true));

    expect(resolveExistingDirectory(['/first', '/second', '/third'])).toBe('/second');
  });

  it('파일은 건너뛰고 실제 디렉토리를 찾음', () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync
      .mockReturnValueOnce(createStats(false))
      .mockReturnValueOnce(createStats(true));

    expect(resolveExistingDirectory(['/file', '/dir'])).toBe('/dir');
  });

  it('후보가 전부 없으면 에러를 던짐', () => {
    mockExistsSync.mockReturnValue(false);

    expect(() => resolveExistingDirectory(['/missing-a', '/missing-b'])).toThrow(
      'No matching input directory found: /missing-a, /missing-b'
    );
  });
});

describe('findMatchingSubdirectories', () => {
  it('키워드가 포함된 디렉토리를 이름 오름차순으로 반환함', () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue(createStats(true));
    mockReaddirSync.mockReturnValue([
      '260425_알리바바_한줄',
      'notes.txt',
      '260426_알리바바_한줄',
      '애견_입력',
    ] as never);

    expect(findMatchingSubdirectories('/input', '알리바바')).toEqual([
      '/input/260425_알리바바_한줄',
      '/input/260426_알리바바_한줄',
    ]);
  });

  it('기준 경로가 없으면 빈 배열을 반환함', () => {
    mockExistsSync.mockReturnValue(false);

    expect(findMatchingSubdirectories('/missing', '알리바바')).toEqual([]);
  });
});
