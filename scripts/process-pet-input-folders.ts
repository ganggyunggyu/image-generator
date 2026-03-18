import * as fs from 'fs';
import * as path from 'path';
import { isImageFile } from './lib/image-filter';
import { type Metadata, parsePetMetadata } from './lib/metadata-parser';
import { listSubdirectories, listFiles } from './lib/local-fs';

const BASE = process.cwd();
const INPUT_DIR = path.join(BASE, '_samples', 'input', '애견입력');
const OUTPUT_DIR = path.join(BASE, '_samples', 'output', '애견_출력');

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const blogIds = listSubdirectories(INPUT_DIR);
let grandTotal = 0;

const createEmptyMetadata = (): Metadata => ({ mapQueries: [], phone: '', url: '', lib_url: [] });

for (const blogId of blogIds) {
  const blogDir = path.join(INPUT_DIR, blogId);
  const keywords = listSubdirectories(blogDir);

  console.log(`\n[Blog] ${blogId} (${keywords.length}개 키워드)`);

  for (const keyword of keywords) {
    const srcDir = path.join(blogDir, keyword);
    const outDir = path.join(OUTPUT_DIR, blogId, keyword);

    console.log(`  [Keyword] ${keyword}`);
    fs.mkdirSync(outDir, { recursive: true });

    const libOut = path.join(outDir, '라이브러리제외');
    fs.mkdirSync(libOut, { recursive: true });

    const files = listFiles(srcDir);

    // 파일명에 "라이브러리" 포함된 이미지 전부 처리
    const libFiles = files
      .filter((f) => f.includes('라이브러리') && isImageFile(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    libFiles.forEach((f, i) => {
      const ext = path.extname(f);
      fs.copyFileSync(path.join(srcDir, f), path.join(libOut, `라이브러리제외_${i + 1}${ext}`));
    });

    console.log(`    라이브러리제외: ${libFiles.length}장`);
    grandTotal += libFiles.length;

    const txtPath = path.join(srcDir, '지도,번호,링크.txt');
    let metadata = createEmptyMetadata();
    if (fs.existsSync(txtPath)) {
      const content = fs.readFileSync(txtPath, 'utf-8');
      metadata = parsePetMetadata(content);
    } else {
      console.log('    metadata source missing: 지도,번호,링크.txt');
    }

    fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
    console.log(
      `    metadata: mapQueries ${metadata.mapQueries.length}개, phone="${metadata.phone}", url="${metadata.url}"`,
    );
  }
}

console.log(`\n총 ${grandTotal}장 처리 완료`);
