import * as fs from 'fs';
import * as path from 'path';
import { isImageFile } from './lib/image-filter';
import { parseInputMetadata, extractBlogId, extractKeyword } from './lib/metadata-parser';
import { listSubdirectories, listFiles } from './lib/local-fs';

const BASE = '/Users/ganggyunggyu/temp-image-gen';
const INPUT_DIR = path.join(BASE, '안과_입력');
const OUTPUT_DIR = path.join(BASE, '안과_출력');

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const blogFolders = listSubdirectories(INPUT_DIR);
let grandTotal = 0;

for (const blogFolder of blogFolders) {
  const blogId = extractBlogId(blogFolder);
  const blogDir = path.join(INPUT_DIR, blogFolder);
  const kwFolders = listSubdirectories(blogDir);

  console.log(`\n📁 ${blogFolder} → blogId: ${blogId} (${kwFolders.length}개 키워드)`);

  for (const kwFolder of kwFolders) {
    const keyword = extractKeyword(kwFolder);
    const srcDir = path.join(blogDir, kwFolder);
    const outDir = path.join(OUTPUT_DIR, blogId, keyword);

    console.log(`  📂 ${kwFolder} → "${keyword}"`);
    fs.mkdirSync(outDir, { recursive: true });

    const files = listFiles(srcDir);
    let folderCount = 0;

    // 본문
    const bodyDir = path.join(outDir, '본문');
    fs.mkdirSync(bodyDir, { recursive: true });
    const bodyFiles = files
      .filter((f) => f.startsWith('대표사진_') && isImageFile(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    bodyFiles.forEach((f, i) => {
      const ext = path.extname(f);
      fs.copyFileSync(path.join(srcDir, f), path.join(bodyDir, `image_${i + 1}${ext}`));
    });
    console.log(`    본문: ${bodyFiles.length}장`);
    folderCount += bodyFiles.length;

    // 라이브러리제외
    const libDir = path.join(outDir, '라이브러리제외');
    fs.mkdirSync(libDir, { recursive: true });
    const libFiles = files
      .filter((f) => f.startsWith('라이브러리 제외사진_') && !f.includes('링크') && isImageFile(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    libFiles.forEach((f, i) => {
      const ext = path.extname(f);
      fs.copyFileSync(path.join(srcDir, f), path.join(libDir, `라이브러리제외_${i + 1}${ext}`));
    });
    console.log(`    라이브러리제외: ${libFiles.length}장`);
    folderCount += libFiles.length;

    // 라이브러리제외_링크
    const libLinkDir = path.join(outDir, '라이브러리제외_링크');
    fs.mkdirSync(libLinkDir, { recursive: true });
    const libLinkFiles = files
      .filter((f) => f.includes('제외사진_링크_') && isImageFile(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    libLinkFiles.forEach((f, i) => {
      const ext = path.extname(f);
      fs.copyFileSync(path.join(srcDir, f), path.join(libLinkDir, `라이브러리제외링크_${i + 1}${ext}`));
    });
    console.log(`    라이브러리제외_링크: ${libLinkFiles.length}장`);
    folderCount += libLinkFiles.length;

    // metadata.json
    const txtPath = path.join(srcDir, '발행 전 필독 사항.txt');
    if (fs.existsSync(txtPath)) {
      const content = fs.readFileSync(txtPath, 'utf-8');
      const metadata = parseInputMetadata(content);
      fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
      console.log(`    metadata: lib_url ${metadata.lib_url.length}개, mapQueries ${metadata.mapQueries.length}개`);
    }

    grandTotal += folderCount;
  }
}

console.log(`\n총 ${grandTotal}장 처리 완료`);
