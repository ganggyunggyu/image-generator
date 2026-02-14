import * as fs from 'fs';
import * as path from 'path';
import { applyLightDistortion } from '../src/utils/image/effects';
import { listImageFiles } from './lib/local-fs';
import { sortByNumeric } from './lib/image-copy';

const DEFAULT_INPUT_DIR = '/Users/ganggyunggyu/temp-image-gen/한려담원/본문';
const DEFAULT_OUTPUT_DIR = '/Users/ganggyunggyu/temp-image-gen/한려담원_변형/본문';

const resolveArgs = (): { inputDir: string; outputDir: string } => {
  const [, , inputArg, outputArg] = process.argv;
  return {
    inputDir: inputArg || DEFAULT_INPUT_DIR,
    outputDir: outputArg || DEFAULT_OUTPUT_DIR,
  };
};

const toWebpName = (filename: string): string => `${path.parse(filename).name}.webp`;

const run = async () => {
  const { inputDir, outputDir } = resolveArgs();
  fs.mkdirSync(outputDir, { recursive: true });

  const files = listImageFiles(inputDir).sort(sortByNumeric);
  console.log(`[Input] ${inputDir}`);
  console.log(`[Output] ${outputDir}`);
  console.log(`[Start] ${files.length}개 이미지 변형 시작\n`);

  for (const [index, file] of files.entries()) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, toWebpName(file));

    const buffer = fs.readFileSync(inputPath);
    const distorted = await applyLightDistortion(buffer);
    fs.writeFileSync(outputPath, distorted);

    console.log(`[${index + 1}/${files.length}] ${file} -> ${path.basename(outputPath)}`);
  }

  console.log(`\n[Done] ${files.length}개 변형 완료`);
};

run().catch(console.error);
