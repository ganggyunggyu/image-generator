import * as fs from 'fs';
import * as path from 'path';
import { resolveNaverId } from './lib/blog-account-map';
import { resolveExistingDirectory } from './lib/input-paths';
import { writeKeywordAccountMappingFile } from './lib/keyword-account-map';
import { processPetInputFolders } from './lib/process-pet-input';

const BASE = process.cwd();
const inputBase = path.join(BASE, '_samples', 'input');

const findAlibabaSubfolder = (): string[] => {
  if (!fs.existsSync(inputBase)) return [];
  return fs.readdirSync(inputBase)
    .filter((name) => name.normalize('NFC').includes('알리바바'))
    .map((name) => path.join(inputBase, name));
};

const INPUT_DIR = resolveExistingDirectory([
  path.join(inputBase, '알리바바입력'),
  path.join(inputBase, '알리바바_입력'),
  ...findAlibabaSubfolder(),
  path.join(inputBase, '애견입력'),
  path.join(inputBase, '애견_입력'),
  path.join(inputBase),
]);
const OUTPUT_DIR = path.join(BASE, '_samples', 'output', '알리바바_출력');

const result = processPetInputFolders({
  inputDir: INPUT_DIR,
  targets: [
    {
      label: '알리바바',
      outputDir: OUTPUT_DIR,
      resolveBlogDirectoryName: ({ blogName }) => {
        const blogId = resolveNaverId(blogName);
        if (!blogId) {
          throw new Error(`알리바바 출력용 blogId 매핑이 없음: ${blogName}`);
        }
        return blogId;
      },
      libraryDirName: '라이브러리제외이미지',
      libraryFilePrefix: '라이브러리제외이미지',
    },
  ],
});

const grandTotal = result.blogs.reduce(
  (sum, blog) => sum + blog.keywords.reduce((keywordSum, keyword) => keywordSum + keyword.libraryCount, 0),
  0,
);
const mappingFilePath = writeKeywordAccountMappingFile({
  outputDir: OUTPUT_DIR,
  mappings: result.blogs.map((blog) => ({
    accountId: resolveNaverId(blog.blogName),
    keywords: blog.keywords.map(({ keyword }) => keyword),
  })),
});

for (const blog of result.blogs) {
  const blogId = resolveNaverId(blog.blogName);
  console.log(`\n[Blog] ${blog.blogName} -> ${blogId} (${blog.keywords.length}개 키워드)`);

  for (const keyword of blog.keywords) {
    console.log(`  [Keyword] ${keyword.keyword}`);
    console.log(`    라이브러리제외이미지: ${keyword.libraryCount}장`);
    console.log(
      `    metadata: mapQueries ${keyword.metadata.mapQueries.length}개, phone="${keyword.metadata.phone}", url="${keyword.metadata.url}"`,
    );
  }
}

console.log(`\n키워드 계정 매칭: ${mappingFilePath}`);
console.log(`\n총 ${grandTotal}장 처리 완료`);
