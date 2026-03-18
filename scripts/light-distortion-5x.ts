import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { applyLightDistortion } from '../src/utils/image/effects';
import { sortByNumeric } from './lib/image-copy';
import { listImageFiles } from './lib/local-fs';

const INPUT_DIR = '/Users/ganggyunggyu/temp-image-gen/한려담원';
const OUTPUT_DIR = '/Users/ganggyunggyu/Documents/한려담원_약변형';
const VARIANT_COUNT = 5;

const createWebpVariant = async (imageBuffer: Buffer): Promise<Buffer> => {
  const distorted = await applyLightDistortion(imageBuffer);

  return sharp(distorted)
    .webp({ quality: 92, smartSubsample: true })
    .toBuffer();
};

const createOutputName = (filename: string, variantIndex: number): string =>
  `${path.parse(filename).name}_v${variantIndex}.webp`;

const processFileVariants = async (
  file: string,
  fileIndex: number,
  totalFiles: number
): Promise<void> => {
  const inputPath = path.join(INPUT_DIR, file);
  const buffer = fs.readFileSync(inputPath);

  console.log(`[${fileIndex + 1}/${totalFiles}] ${file}`);

  for (let variantIndex = 1; variantIndex <= VARIANT_COUNT; variantIndex++) {
    const outputName = createOutputName(file, variantIndex);
    const outputPath = path.join(OUTPUT_DIR, outputName);
    const distorted = await createWebpVariant(buffer);

    fs.writeFileSync(outputPath, distorted);
    console.log(`  -> ${outputName}`);
  }
};

const run = async (): Promise<void> => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = listImageFiles(INPUT_DIR).sort(sortByNumeric);
  console.log(`[Input] ${INPUT_DIR}`);
  console.log(`[Output] ${OUTPUT_DIR}`);
  console.log(`[Start] ${files.length}개 이미지 × ${VARIANT_COUNT}개 변형\n`);

  for (const [fileIdx, file] of files.entries()) {
    await processFileVariants(file, fileIdx, files.length);
  }

  console.log(`\n[Done] 총 ${files.length * VARIANT_COUNT}개 변형 완료 -> ${OUTPUT_DIR}`);
};

run().catch(console.error);
