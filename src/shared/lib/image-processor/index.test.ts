import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processImages } from '@/shared/lib/image-processor';

const SAMPLE_IMAGE_PATH = path.resolve(process.cwd(), '한려담원/본문/image_20.webp');
const OUTPUT_DIR = path.resolve(process.cwd(), '한려담원-distort-test/api-smoke');

type DistortionCase = {
  distortionLevel: 'none' | 'light' | 'heavy';
  filename: string;
  useFilter: boolean;
};

const decodeDataUrl = (dataUrl: string): Buffer => {
  const [, base64 = ''] = dataUrl.split(',');
  return Buffer.from(base64, 'base64');
};

const runPipeline = async ({ distortionLevel, filename, useFilter }: DistortionCase): Promise<Buffer> => {
  const sourceBuffer = fs.readFileSync(SAMPLE_IMAGE_PATH);
  const sourceUrl = `data:image/webp;base64,${sourceBuffer.toString('base64')}`;

  const result = await processImages(
    [{ link: sourceUrl }],
    1,
    [],
    {
      useS3: false,
      folderName: `smoke-${distortionLevel}`,
      useFilter,
      distortionLevel,
    }
  );

  expect(result.failed).toBe(0);
  expect(result.images).toHaveLength(1);

  const outputUrl = result.images[0]?.url || '';
  expect(outputUrl.startsWith('data:image/png;base64,')).toBe(true);

  const pngBuffer = decodeDataUrl(outputUrl);
  expect(pngBuffer.length).toBeGreaterThan(0);

  if (process.env.SAVE_SMOKE_OUTPUTS === '1') {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), pngBuffer);
  }

  return pngBuffer;
};

describe('processImages smoke', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('none/light/heavy 파이프라인이 각 1장씩 이미지를 생성함', async () => {
    const noneBuffer = await runPipeline({
      distortionLevel: 'none',
      filename: 'none.png',
      useFilter: false,
    });
    const lightBuffer = await runPipeline({
      distortionLevel: 'light',
      filename: 'light.png',
      useFilter: false,
    });
    const heavyBuffer = await runPipeline({
      distortionLevel: 'heavy',
      filename: 'heavy.png',
      useFilter: true,
    });

    expect(noneBuffer.equals(lightBuffer)).toBe(false);
    expect(lightBuffer.equals(heavyBuffer)).toBe(false);
  });
});
