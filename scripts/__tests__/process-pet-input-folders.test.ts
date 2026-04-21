import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildKeywordAccountMappingContent,
  writeKeywordAccountMappingFile,
} from '../lib/keyword-account-map';
import { processPetInputFolders } from '../lib/process-pet-input';

const createTempDir = (): string =>
  fs.mkdtempSync(path.join(os.tmpdir(), 'pet-process-'));

const writeFile = (filePath: string, content: string): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

describe('processPetInputFolders', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('애견 출력과 알리바바 출력을 각 레이아웃으로 생성함', () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const inputDir = path.join(tempDir, 'input');
    const petOutputDir = path.join(tempDir, 'pet-output');
    const alibabaOutputDir = path.join(tempDir, 'alibaba-output');

    writeFile(path.join(inputDir, '룰루랄라', '골든두들', '라이브러리제외_1.jpg'), 'jpg');
    writeFile(path.join(inputDir, '룰루랄라', '골든두들', '라이브러리제외_2.png'), 'png');
    writeFile(
      path.join(inputDir, '룰루랄라', '골든두들', '지도,번호,링크.txt'),
      ['플레이스 지도 : 도그마루 논현, 도그마루 검단', '번호 : 1566-8713', 'https://dmanimal.co.kr/'].join('\n'),
    );

    const result = processPetInputFolders({
      inputDir,
      targets: [
        {
          label: '애견',
          outputDir: petOutputDir,
          resolveBlogDirectoryName: ({ blogName }) => blogName,
          libraryDirName: '라이브러리제외',
          libraryFilePrefix: '라이브러리제외',
        },
        {
          label: '알리바바',
          outputDir: alibabaOutputDir,
          resolveBlogDirectoryName: () => 'compare14310',
          libraryDirName: '라이브러리제외이미지',
          libraryFilePrefix: '라이브러리제외이미지',
        },
      ],
    });

    expect(result.grandTotal).toBe(4);
    expect(fs.existsSync(path.join(petOutputDir, '룰루랄라', '골든두들', '라이브러리제외', '라이브러리제외_1.jpg'))).toBe(
      true,
    );
    expect(
      fs.existsSync(
        path.join(
          alibabaOutputDir,
          'compare14310',
          '골든두들',
          '라이브러리제외이미지',
          '라이브러리제외이미지_2.png',
        ),
      ),
    ).toBe(true);

    const petMetadata = JSON.parse(
      fs.readFileSync(path.join(petOutputDir, '룰루랄라', '골든두들', 'metadata.json'), 'utf-8'),
    ) as { mapQueries: string[]; phone: string; url: string };
    const alibabaMetadata = JSON.parse(
      fs.readFileSync(path.join(alibabaOutputDir, 'compare14310', '골든두들', 'metadata.json'), 'utf-8'),
    ) as { mapQueries: string[]; phone: string; url: string };

    expect(petMetadata).toEqual(alibabaMetadata);
    expect(petMetadata.mapQueries).toEqual(['도그마루 논현', '도그마루 검단']);
    expect(petMetadata.phone).toBe('1566-8713');
    expect(petMetadata.url).toBe('https://dmanimal.co.kr/');

    const keywordAccountMapPath = writeKeywordAccountMappingFile({
      outputDir: alibabaOutputDir,
      mappings: [
        {
          accountId: 'compare14310',
          keywords: result.blogs[0]?.keywords.map(({ keyword }) => keyword) ?? [],
        },
      ],
    });

    expect(fs.readFileSync(keywordAccountMapPath, 'utf-8')).toBe(
      buildKeywordAccountMappingContent([
        {
          accountId: 'compare14310',
          keywords: ['골든두들'],
        },
      ]),
    );
  });

  it('타깃이 blogId를 만들지 못하면 실패함', () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const inputDir = path.join(tempDir, 'input');
    writeFile(path.join(inputDir, '없는블로그', '키워드', '라이브러리제외_1.jpg'), 'jpg');

    expect(() =>
      processPetInputFolders({
        inputDir,
        targets: [
          {
            label: '알리바바',
            outputDir: path.join(tempDir, 'alibaba-output'),
            resolveBlogDirectoryName: () => {
              throw new Error('unmapped blog: 없는블로그');
            },
            libraryDirName: '라이브러리제외이미지',
            libraryFilePrefix: '라이브러리제외이미지',
          },
        ],
      }),
    ).toThrow('unmapped blog: 없는블로그');
  });
});
