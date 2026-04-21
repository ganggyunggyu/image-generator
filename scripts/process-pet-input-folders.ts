import * as path from 'path';
import { processPetInputFolders } from './lib/process-pet-input';
import { resolveExistingDirectory } from './lib/input-paths';

const BASE = process.cwd();
const INPUT_DIR = resolveExistingDirectory([
  path.join(BASE, '_samples', 'input', '애견입력'),
  path.join(BASE, '_samples', 'input', '애견_입력'),
  path.join(BASE, '_samples', 'input'),
]);
const OUTPUT_DIR = path.join(BASE, '_samples', 'output', '애견_출력');

const result = processPetInputFolders({
  inputDir: INPUT_DIR,
  targets: [
    {
      label: '애견',
      outputDir: OUTPUT_DIR,
      resolveBlogDirectoryName: ({ blogName }) => blogName,
      libraryDirName: '라이브러리제외',
      libraryFilePrefix: '라이브러리제외',
    },
  ],
});

const grandTotal = result.blogs.reduce(
  (sum, blog) => sum + blog.keywords.reduce((keywordSum, keyword) => keywordSum + keyword.libraryCount, 0),
  0,
);

for (const blog of result.blogs) {
  console.log(`\n[Blog] ${blog.blogName} (${blog.keywords.length}개 키워드)`);

  for (const keyword of blog.keywords) {
    console.log(`  [Keyword] ${keyword.keyword}`);
    console.log(`    라이브러리제외: ${keyword.libraryCount}장`);
    console.log(
      `    metadata: mapQueries ${keyword.metadata.mapQueries.length}개, phone="${keyword.metadata.phone}", url="${keyword.metadata.url}"`,
    );
  }
}

console.log(`\n총 ${grandTotal}장 처리 완료`);
