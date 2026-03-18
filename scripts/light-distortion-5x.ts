import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const INPUT_DIR = '/Users/ganggyunggyu/temp-image-gen/한려담원';
const OUTPUT_DIR = '/Users/ganggyunggyu/Documents/한려담원_약변형';
const VARIANT_COUNT = 5;
const TRANSPARENT_BG = { r: 0, g: 0, b: 0, alpha: 0 } as const;

const applyLightDistortion = async (imageBuffer: Buffer): Promise<Buffer> => {
  const metadata = await sharp(imageBuffer).metadata();
  const { width = 800, height = 600 } = metadata;

  const brightness = 0.80 + Math.random() * 0.4;
  const saturation = 0.80 + Math.random() * 0.4;
  const hue = Math.floor(Math.random() * 25) - 12;
  const cropPercent = 0.02 + Math.random() * 0.08;
  const gamma = 1.0 + Math.random() * 0.3;
  const ratioX = 1 + (Math.random() * 0.06 - 0.03);
  const ratioY = 1 + (Math.random() * 0.06 - 0.03);
  const perspectiveX = Math.random() * 0.04 - 0.02;
  const skewDeg = Math.random() * 3 - 1.5;
  const skewRad = (skewDeg * Math.PI) / 180;

  const cropX = Math.floor(width * cropPercent);
  const cropY = Math.floor(height * cropPercent);
  const cropWidth = width - cropX * 2;
  const cropHeight = height - cropY * 2;
  const newWidth = Math.round(cropWidth * ratioX);
  const newHeight = Math.round(cropHeight * ratioY);

  const skewMatrix: [number, number, number, number] = [
    1 + perspectiveX,
    Math.tan(skewRad),
    0,
    1 - perspectiveX,
  ];

  console.log(`  bright(${brightness.toFixed(2)}) sat(${saturation.toFixed(2)}) hue(${hue}) crop(${(cropPercent * 100).toFixed(1)}%) gamma(${gamma.toFixed(2)}) ratio(${ratioX.toFixed(3)}x${ratioY.toFixed(3)}) perspective(${(perspectiveX * 100).toFixed(1)}%) skew(${skewDeg.toFixed(1)}°)`);

  return sharp(imageBuffer)
    .ensureAlpha()
    .extract({
      left: cropX,
      top: cropY,
      width: Math.max(cropWidth, 1),
      height: Math.max(cropHeight, 1),
    })
    .resize(Math.max(newWidth, 1), Math.max(newHeight, 1), { fit: 'fill' })
    .affine(skewMatrix, { background: TRANSPARENT_BG })
    .modulate({ brightness, saturation, hue })
    .gamma(gamma)
    .webp({ quality: 92, smartSubsample: true })
    .toBuffer();
};

const run = async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(INPUT_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  console.log(`[Input] ${INPUT_DIR}`);
  console.log(`[Output] ${OUTPUT_DIR}`);
  console.log(`[Start] ${files.length}개 이미지 × ${VARIANT_COUNT}개 변형\n`);

  for (const [fileIdx, file] of files.entries()) {
    const inputPath = path.join(INPUT_DIR, file);
    const buffer = fs.readFileSync(inputPath);
    const baseName = path.parse(file).name;

    console.log(`[${fileIdx + 1}/${files.length}] ${file}`);

    for (let v = 1; v <= VARIANT_COUNT; v++) {
      const outputName = `${baseName}_v${v}.webp`;
      const outputPath = path.join(OUTPUT_DIR, outputName);
      const distorted = await applyLightDistortion(buffer);
      fs.writeFileSync(outputPath, distorted);
      console.log(`  -> ${outputName}`);
    }
  }

  console.log(`\n[Done] 총 ${files.length * VARIANT_COUNT}개 변형 완료 -> ${OUTPUT_DIR}`);
};

run().catch(console.error);
