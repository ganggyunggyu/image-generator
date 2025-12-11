import sharp from 'sharp';
import { clamp } from '@/utils/helpers';

export interface ConvertToWebpOptions {
  width?: number | undefined;
  height?: number | undefined;
  quality?: number;
}

const WHITE_THRESHOLD = 245;

/**
 * 흰색(근처) 픽셀을 투명으로 변환합니다.
 */
const convertWhiteToTransparent = async (imageBuffer: Buffer): Promise<Buffer> => {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
};

export const convertToWebp = async (
  imageBuffer: Buffer,
  options: ConvertToWebpOptions = {}
): Promise<Buffer> => {
  try {
    console.log('🔄✨ WebP 변환 시작한다!! 🚀💫');

    const { width, height, quality = 90 } = options;

    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();

    console.log('📸💎 원본 이미지 정보 확인!! 🔍✨', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
    });

    const targetWidth = width || metadata.width;
    const targetHeight = height || metadata.height;

    const transparentBuffer = await convertWhiteToTransparent(imageBuffer);

    const webpBuffer = await sharp(transparentBuffer)
      .trim()
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({
        quality: clamp(quality, 1, 100),
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 4,
      })
      .toBuffer();

    console.log(`✅🎉 WebP 변환 성공했다!! 개쩐다!! 🔥💯 ${webpBuffer.length} bytes (${targetWidth}x${targetHeight}, quality: ${quality}) 🌟`);
    return webpBuffer;
  } catch (error) {
    console.error('❌💥 WebP 변환 실패!! 박살났다!! 😭🔥', error);

    if (error instanceof Error) {
      throw new Error(`이미지 변환 실패: ${error.message}`);
    }

    throw new Error('알 수 없는 이미지 변환 오류가 발생했습니다');
  }
};
