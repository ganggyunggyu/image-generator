import * as path from 'path';
import { processPetInputFolders } from './lib/process-pet-input';

const DEFAULT_NAS_PET_BASE_DIR = '/Volumes/21lab_데이터관리/0_자동발행/0_애견자동발행';
const DEFAULT_INPUT_DIR = path.join(DEFAULT_NAS_PET_BASE_DIR, '애견_0507');
const DEFAULT_OUTPUT_DIR = path.join(DEFAULT_NAS_PET_BASE_DIR, '애견_0507_출력');

const INPUT_DIR = process.env.PET_INPUT_DIR ? path.resolve(process.env.PET_INPUT_DIR) : DEFAULT_INPUT_DIR;
const OUTPUT_DIR = process.env.PET_OUTPUT_DIR ? path.resolve(process.env.PET_OUTPUT_DIR) : DEFAULT_OUTPUT_DIR;
const SKIP_EXISTING_OUTPUTS = process.env.PET_FORCE_REPROCESS !== '1';

console.log(`input: ${INPUT_DIR}`);
console.log(`output: ${OUTPUT_DIR}`);
console.log(`skip existing: ${SKIP_EXISTING_OUTPUTS ? 'yes' : 'no'}`);

const result = processPetInputFolders({
  inputDir: INPUT_DIR,
  skipExistingOutputs: SKIP_EXISTING_OUTPUTS,
  targets: [
    {
      label: '애견 NAS',
      outputDir: OUTPUT_DIR,
      resolveBlogDirectoryName: ({ blogName }) => blogName,
      libraryDirName: '라이브러리제외',
      libraryFilePrefix: '라이브러리제외',
    },
  ],
});

for (const blog of result.blogs) {
  console.log(`\n[Blog] ${blog.blogName} (${blog.keywords.length}개 키워드)`);

  for (const keyword of blog.keywords) {
    console.log(`  [Keyword] ${keyword.keyword}`);
    console.log(`    라이브러리제외: ${keyword.libraryCount}장`);
    console.log(`    write/skip: ${keyword.writtenTargets}/${keyword.skippedTargets}`);
    console.log(
      `    metadata: mapQueries ${keyword.metadata.mapQueries.length}개, phone="${keyword.metadata.phone}", url="${keyword.metadata.url}"`,
    );
  }
}

console.log(`\n총 ${result.grandTotal}장 처리 완료`);
