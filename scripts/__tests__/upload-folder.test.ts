import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('../lib/s3-client', () => {
  const mockSend = vi.fn().mockResolvedValue({});
  class MockPutObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  class MockListObjectsV2Command {
    constructor(public input: Record<string, unknown>) {}
  }
  class MockDeleteObjectsCommand {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    s3: () => ({ send: mockSend }),
    BUCKET: 'test-bucket',
    PutObjectCommand: MockPutObjectCommand,
    ListObjectsV2Command: MockListObjectsV2Command,
    DeleteObjectsCommand: MockDeleteObjectsCommand,
    __mockSend: mockSend,
  };
});

import { uploadProductFolder } from '../lib/upload-folder';
import { __mockSend } from '../lib/s3-client';

const mockExistsSync = vi.mocked(fs.existsSync);
const mockReaddirSync = vi.mocked(fs.readdirSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);
const mockSend = vi.mocked(__mockSend);

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

  it('라이브러리제외이미지 폴더도 기본 업로드 대상에 포함함', async () => {
    mockExistsSync.mockImplementation((p: fs.PathLike) => p.toString().includes('라이브러리제외이미지'));
    mockReaddirSync.mockReturnValue(['image_1.png', 'notes.txt'] as never);
    mockReadFileSync.mockReturnValue(Buffer.from('test') as never);

    const count = await uploadProductFolder({
      localBase: '/local/alibaba',
      s3Base: 'product-images/alibaba',
      verbose: false,
    });

    expect(count).toBe(1);
  });

  it('업로드 전에 기존 S3 prefix 오브젝트를 지우고 다시 올림', async () => {
    mockExistsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = p.toString();
      return pathStr.includes('본문') || pathStr.includes('metadata.json');
    });
    mockReaddirSync.mockReturnValue(['image_1.png'] as never);
    mockReadFileSync.mockReturnValue(Buffer.from('test') as never);
    mockSend.mockImplementation(async (command: { constructor: { name: string } }) => {
      if (command.constructor.name === 'MockListObjectsV2Command') {
        return {
          Contents: [
            { Key: 'product-images/test/본문/image_9.png' },
            { Key: 'product-images/test/metadata.json' },
          ],
          IsTruncated: false,
        };
      }

      return {};
    });

    await uploadProductFolder({
      localBase: '/local/test',
      s3Base: 'product-images/test',
      verbose: false,
    });

    const deleteCall = mockSend.mock.calls.find(
      ([command]) => command.constructor.name === 'MockDeleteObjectsCommand',
    );
    expect(deleteCall?.[0].input).toEqual({
      Bucket: 'test-bucket',
      Delete: {
        Objects: [
          { Key: 'product-images/test/본문/image_9.png' },
          { Key: 'product-images/test/metadata.json' },
        ],
      },
    });
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
