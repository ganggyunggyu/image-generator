import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('../lib/s3-client', () => {
  const mockSend = vi.fn().mockResolvedValue({});
  class MockPutObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    s3: () => ({ send: mockSend }),
    BUCKET: 'test-bucket',
    PutObjectCommand: MockPutObjectCommand,
    __mockSend: mockSend,
  };
});

import { uploadProductFolder } from '../lib/upload-folder';

const mockExistsSync = vi.mocked(fs.existsSync);
const mockReaddirSync = vi.mocked(fs.readdirSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('uploadProductFolder', () => {
  it('서브폴더 순회하며 이미지 업로드', async () => {
    mockExistsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = p.toString();
      return pathStr.includes('본문') || pathStr.includes('metadata.json');
    });
    mockReaddirSync.mockReturnValue(['image_1.png', 'image_2.jpg', 'readme.txt'] as never);
    mockReadFileSync.mockReturnValue(Buffer.from('test') as never);

    const count = await uploadProductFolder({
      localBase: '/local/test',
      s3Base: 'product-images/test',
      verbose: false,
    });

    // 본문만 존재 → 이미지 2개 (readme.txt는 필터링)
    expect(count).toBe(2);
  });

  it('존재하지 않는 서브폴더 스킵', async () => {
    mockExistsSync.mockReturnValue(false);

    const count = await uploadProductFolder({
      localBase: '/local/empty',
      s3Base: 'product-images/empty',
      verbose: false,
    });

    expect(count).toBe(0);
  });

  it('이미지 없는 서브폴더 스킵', async () => {
    mockExistsSync.mockImplementation((p: fs.PathLike) => p.toString().includes('본문'));
    mockReaddirSync.mockReturnValue(['readme.txt', '.gitkeep'] as never);

    const count = await uploadProductFolder({
      localBase: '/local/test',
      s3Base: 'product-images/test',
      verbose: false,
    });

    expect(count).toBe(0);
  });
});
