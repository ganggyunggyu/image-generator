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

  it('여러 입력 폴더를 받은 순서대로 합쳐 같은 블로그 키워드를 이어붙임', () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const inputDir25 = path.join(tempDir, '260425_알리바바_한줄');
    const inputDir26 = path.join(tempDir, '260426_알리바바_한줄');
    const outputDir = path.join(tempDir, 'alibaba-output');

    writeFile(path.join(inputDir25, '1', '글로벌소싱순위', '라이브러리제외.JPG'), 'jpg');
    writeFile(path.join(inputDir25, '1', '중국구매대행추천', '라이브러리제외.JPG'), 'jpg');
    writeFile(path.join(inputDir25, '1', '중국수입절차', '라이브러리제외.JPG'), 'jpg');
    writeFile(path.join(inputDir26, '1', '도매거래절차', '라이브러리제외.JPG'), 'jpg');
    writeFile(path.join(inputDir26, '1', '도매거래하는법', '라이브러리제외.JPG'), 'jpg');
    writeFile(path.join(inputDir26, '1', '도매구매대행', '라이브러리제외.JPG'), 'jpg');

    const result = processPetInputFolders({
      inputDirs: [inputDir25, inputDir26],
      targets: [
        {
          label: '알리바바',
          outputDir,
          resolveBlogDirectoryName: () => 'weed3122',
          libraryDirName: '라이브러리제외이미지',
          libraryFilePrefix: '라이브러리제외이미지',
        },
      ],
    });

    expect(result.grandTotal).toBe(6);
    expect(result.blogs).toHaveLength(1);
    expect(result.blogs[0]?.keywords.map(({ keyword }) => keyword)).toEqual([
      '글로벌소싱순위',
      '중국구매대행추천',
      '중국수입절차',
      '도매거래절차',
      '도매거래하는법',
      '도매구매대행',
    ]);
    expect(
      fs.existsSync(path.join(outputDir, 'weed3122', '도매구매대행', '라이브러리제외이미지', '라이브러리제외이미지_1.JPG')),
    ).toBe(true);
  });

  it('출력 결과가 이미 있으면 재처리하지 않고 기존 파일을 유지함', () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const inputDir = path.join(tempDir, 'input');
    const outputDir = path.join(tempDir, 'pet-output');
    const existingImagePath = path.join(outputDir, '룰루랄라', '골든두들', '라이브러리제외', '라이브러리제외_1.jpg');
    const existingMetadataPath = path.join(outputDir, '룰루랄라', '골든두들', 'metadata.json');

    writeFile(path.join(inputDir, '룰루랄라', '골든두들', '라이브러리제외_1.jpg'), 'new-image');
    writeFile(existingImagePath, 'existing-image');
    writeFile(existingMetadataPath, JSON.stringify({ mapQueries: ['기존'], phone: '010', url: 'https://existing.test/' }));

    const result = processPetInputFolders({
      inputDir,
      skipExistingOutputs: true,
      targets: [
        {
          label: '애견',
          outputDir,
          resolveBlogDirectoryName: ({ blogName }) => blogName,
          libraryDirName: '라이브러리제외',
          libraryFilePrefix: '라이브러리제외',
        },
      ],
    });

    expect(result.grandTotal).toBe(0);
    expect(result.blogs[0]?.keywords[0]?.writtenTargets).toBe(0);
    expect(result.blogs[0]?.keywords[0]?.skippedTargets).toBe(1);
    expect(fs.readFileSync(existingImagePath, 'utf-8')).toBe('existing-image');
    expect(fs.readFileSync(existingMetadataPath, 'utf-8')).toContain('existing.test');
  });

  it('자모 분리된 라이브러리 파일명도 이미지로 처리함', () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const inputDir = path.join(tempDir, 'input');
    const outputDir = path.join(tempDir, 'pet-output');
    const decomposedLibraryName = '1_라이브러리제외.jpg.jpg';

    writeFile(path.join(inputDir, '룰루랄라', '골든두들', decomposedLibraryName), 'jpg');

    const result = processPetInputFolders({
      inputDir,
      targets: [
        {
          label: '애견',
          outputDir,
          resolveBlogDirectoryName: ({ blogName }) => blogName,
          libraryDirName: '라이브러리제외',
          libraryFilePrefix: '라이브러리제외',
        },
      ],
    });

    expect(result.grandTotal).toBe(1);
    expect(result.blogs[0]?.keywords[0]?.libraryCount).toBe(1);
    expect(fs.existsSync(path.join(outputDir, '룰루랄라', '골든두들', '라이브러리제외', '라이브러리제외_1.jpg'))).toBe(
      true,
    );
  });
});
