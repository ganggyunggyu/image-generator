import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { applyLightDistortion } from '../src/utils/image/effects';

const INPUT_DIR = process.argv[2] || '/Users/ganggyunggyu/temp-image-gen/한려담원/본문';
const OUTPUT_DIR = process.argv[3] || '/Users/ganggyunggyu/temp-image-gen/한려담원_변형/본문';

const run = async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(INPUT_DIR).filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  console.log(`📁 ${INPUT_DIR}`);
  console.log(`📂 ${OUTPUT_DIR}`);
  console.log(`🔄 ${files.length}개 이미지 변형 시작\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace(/\.[^.]+$/, '.webp'));

    const buffer = fs.readFileSync(inputPath);
    const distorted = await applyLightDistortion(buffer);
    fs.writeFileSync(outputPath, distorted);

    console.log(`[${i + 1}/${files.length}] ${file} → ${path.basename(outputPath)}`);
  }

  console.log(`\n✅ ${files.length}개 변형 완료!`);
};

run().catch(console.error);
