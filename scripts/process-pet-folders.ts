import * as fs from 'fs';
import * as path from 'path';

const BASE = '/Users/ganggyunggyu/temp-image-gen';
const INPUT_DIR = path.join(BASE, '서리펫_글밥');
const OUTPUT_DIR = path.join(BASE, '서리펫_글밥_출력');

const IMG_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

interface Metadata {
  mapQueries: string[];
  phone: string;
  url: string;
  lib_url: string[];
}

function parseMetadata(txtPath: string): Metadata {
  const content = fs.readFileSync(txtPath, 'utf-8');
  const lines = content.split('\n').map((l) => l.trim());

  const mapQueries: string[] = [];
  let phone = '';
  let url = '';

  for (const line of lines) {
    const mapMatch = line.match(/플레이스\s*지도\s*:\s*(.+)/);
    if (mapMatch) {
      mapQueries.push(...mapMatch[1]!.split(',').map((s) => s.trim()).filter(Boolean));
    }

    const phoneMatch = line.match(/번호\s*:\s*(.+)/);
    if (phoneMatch) {
      phone = phoneMatch[1]!.trim();
    }

    if (line.startsWith('https://') || line.startsWith('http://')) {
      url = line;
    }
  }

  return { mapQueries, phone, url, lib_url: [] };
}

function isImage(filename: string): boolean {
  return IMG_EXTS.some((e) => filename.toLowerCase().endsWith(e));
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const blogIds = fs.readdirSync(INPUT_DIR).filter((f) =>
  fs.statSync(path.join(INPUT_DIR, f)).isDirectory()
);

let grandTotal = 0;

for (const blogId of blogIds.sort()) {
  const blogDir = path.join(INPUT_DIR, blogId);
  const keywords = fs.readdirSync(blogDir).filter((f) =>
    fs.statSync(path.join(blogDir, f)).isDirectory()
  );

  console.log(`\n📁 blogId: ${blogId} (${keywords.length}개 키워드)`);

  for (const keyword of keywords.sort()) {
    const srcDir = path.join(blogDir, keyword);
    const outDir = path.join(OUTPUT_DIR, blogId, keyword);

    console.log(`  📂 ${keyword}`);
    fs.mkdirSync(outDir, { recursive: true });

    const libOut = path.join(outDir, '라이브러리제외');
    fs.mkdirSync(libOut, { recursive: true });

    const files = fs.readdirSync(srcDir).filter((f) => !fs.statSync(path.join(srcDir, f)).isDirectory());

    // 공정위문구 → 라이브러리제외_1
    const gongFiles = files.filter((f) => f.includes('공정위문구') && isImage(f));
    gongFiles.forEach((f) => {
      const ext = path.extname(f);
      fs.copyFileSync(path.join(srcDir, f), path.join(libOut, `라이브러리제외_1${ext}`));
    });

    // 나머지 이미지 (공정위문구 제외) → 라이브러리제외_2, _3, ...
    const restFiles = files
      .filter((f) => !f.includes('공정위문구') && isImage(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    restFiles.forEach((f, i) => {
      const ext = path.extname(f);
      fs.copyFileSync(path.join(srcDir, f), path.join(libOut, `라이브러리제외_${i + 2}${ext}`));
    });

    const imgCount = gongFiles.length + restFiles.length;
    console.log(`    라이브러리제외: ${imgCount}장`);
    grandTotal += imgCount;

    // metadata.json
    const txtPath = path.join(srcDir, '지도,번호,링크.txt');
    if (fs.existsSync(txtPath)) {
      const metadata = parseMetadata(txtPath);
      fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
      console.log(`    metadata: mapQueries ${metadata.mapQueries.length}개, phone="${metadata.phone}", url="${metadata.url}"`);
    }
  }
}

console.log(`\n총 ${grandTotal}장 처리 완료`);
