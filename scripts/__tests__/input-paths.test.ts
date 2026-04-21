import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import { resolveExistingDirectory } from '../lib/input-paths';

vi.mock('fs');

const mockExistsSync = vi.mocked(fs.existsSync);
const mockStatSync = vi.mocked(fs.statSync);

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
