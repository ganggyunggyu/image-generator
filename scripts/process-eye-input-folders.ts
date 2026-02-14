import * as fs from 'fs';
import * as path from 'path';
import { copyImageGroup, type ImageCopyGroup } from './lib/image-copy';
import { parseInputMetadata, extractBlogId, extractKeyword } from './lib/metadata-parser';
import { listSubdirectories, listFiles } from './lib/local-fs';

const BASE = '/Users/ganggyunggyu/temp-image-gen';
const INPUT_DIR = path.join(BASE, '_samples', 'input', '안과_입력');
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const OUTPUT_DIR = path.join(BASE, '_samples', 'output', `안과_출력_${today}`);

const IMAGE_GROUPS: ImageCopyGroup[] = [
  {
    label: '본문',
    outputDirName: '본문',
    outputPrefix: 'image',
    match: (filename) => filename.startsWith('대표사진_'),
  },
  {
    label: '라이브러리제외',
    outputDirName: '라이브러리제외',
    outputPrefix: '라이브러리제외',
    match: (filename) =>
      filename.includes('라이브러리') && filename.includes('제외') && !filename.includes('링크'),
  },
  {
    label: '라이브러리제외_링크',
    outputDirName: '라이브러리제외_링크',
    outputPrefix: '라이브러리제외링크',
    match: (filename) => filename.includes('링크'),
  },
];

const logGroupCount = (label: string, count: number): void => {
  if (count > 0) console.log(`    ${label}: ${count}장`);
};

const writeMetadataIfExists = (srcDir: string, outDir: string): void => {
  const txtPath = path.join(srcDir, '발행 전 필독 사항.txt');
  if (!fs.existsSync(txtPath)) return;

  const content = fs.readFileSync(txtPath, 'utf-8');
  const metadata = parseInputMetadata(content);
  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(`    metadata: lib_url ${metadata.lib_url.length}개, mapQueries ${metadata.mapQueries.length}개`);
};

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const blogFolders = listSubdirectories(INPUT_DIR);
let grandTotal = 0;

for (const blogFolder of blogFolders) {
  const blogId = extractBlogId(blogFolder);
  const blogDir = path.join(INPUT_DIR, blogFolder);
  const kwFolders = listSubdirectories(blogDir);

  console.log(`\n[Blog] ${blogFolder} -> blogId: ${blogId} (${kwFolders.length}개 키워드)`);

  for (const kwFolder of kwFolders) {
    const keyword = extractKeyword(kwFolder);
    const srcDir = path.join(blogDir, kwFolder);
    const outDir = path.join(OUTPUT_DIR, blogId, keyword);

    console.log(`  [Keyword] ${kwFolder} -> "${keyword}"`);
    fs.mkdirSync(outDir, { recursive: true });

    const files = listFiles(srcDir);
    let folderCount = 0;

    for (const group of IMAGE_GROUPS) {
      const count = copyImageGroup({ files, srcDir, outDir, group });
      logGroupCount(group.label, count);
      folderCount += count;
    }

    grandTotal += folderCount;
    writeMetadataIfExists(srcDir, outDir);
  }
}

console.log(`\n총 ${grandTotal}장 처리 완료`);
