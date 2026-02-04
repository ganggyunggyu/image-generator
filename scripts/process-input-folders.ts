import * as fs from 'fs';
import * as path from 'path';

const BASE = '/Users/ganggyunggyu/temp-image-gen';
const INPUT_DIR = path.join(BASE, '안과_입력');
const OUTPUT_DIR = path.join(BASE, '안과_출력');

const IMG_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

function isImage(filename: string): boolean {
  return IMG_EXTS.some((e) => filename.toLowerCase().endsWith(e));
}

function extractBlogId(folderName: string): string {
  const parts = folderName.split('_');
  return parts[parts.length - 1]!;
}

function extractKeyword(folderName: string): string {
  const withoutNumber = folderName.replace(/^\d+\./, '');
  const parts = withoutNumber.split('_');
  return parts[0]!.trim();
}

function parseMetadata(txtPath: string) {
  const content = fs.readFileSync(txtPath, 'utf-8');
  const lines = content.split('\n').map((l) => l.trim());

  const libUrls: string[] = [];
  const mapQueries: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('https://') || line.startsWith('http://')) {
      const prevLine = lines[i - 1] || '';
      if (prevLine.includes('링크') && prevLine.includes('삽입')) {
        libUrls.push(line);
      }
    }

    const mapMatch = line.match(/지도\s*추가\s*\[(.+)\]/);
    if (mapMatch) {
      mapQueries.push(mapMatch[1]!);
    }
  }

  return { mapQueries, phone: '', url: '', lib_url: libUrls };
}

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const blogFolders = fs.readdirSync(INPUT_DIR).filter((f) =>
  fs.statSync(path.join(INPUT_DIR, f)).isDirectory()
);

let grandTotal = 0;

for (const blogFolder of blogFolders.sort()) {
  const blogId = extractBlogId(blogFolder);
  const blogDir = path.join(INPUT_DIR, blogFolder);
  const kwFolders = fs.readdirSync(blogDir).filter((f) =>
    fs.statSync(path.join(blogDir, f)).isDirectory()
  );

  console.log(`\n📁 ${blogFolder} → blogId: ${blogId} (${kwFolders.length}개 키워드)`);

  for (const kwFolder of kwFolders.sort()) {
    const keyword = extractKeyword(kwFolder);
    const srcDir = path.join(blogDir, kwFolder);
    const outDir = path.join(OUTPUT_DIR, blogId, keyword);

    console.log(`  📂 ${kwFolder} → "${keyword}"`);
    fs.mkdirSync(outDir, { recursive: true });

    const files = fs.readdirSync(srcDir).filter((f) => {
      const fp = path.join(srcDir, f);
      return !fs.statSync(fp).isDirectory();
    });

    let folderCount = 0;

    // 본문 (대표사진_N)
    const bodyDir = path.join(outDir, '본문');
    fs.mkdirSync(bodyDir, { recursive: true });
    const bodyFiles = files
      .filter((f) => f.startsWith('대표사진_') && isImage(f))
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
      .filter((f) => f.startsWith('라이브러리 제외사진_') && !f.includes('링크') && isImage(f))
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
      .filter((f) => f.includes('제외사진_링크_') && isImage(f))
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
      const metadata = parseMetadata(txtPath);
      fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
      console.log(`    metadata: lib_url ${metadata.lib_url.length}개, mapQueries ${metadata.mapQueries.length}개`);
    }

    grandTotal += folderCount;
  }
}

console.log(`\n총 ${grandTotal}장 처리 완료`);
