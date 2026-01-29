import sharp from 'sharp';
import { clamp } from '@/utils/helpers';

export interface ConvertToWebpOptions {
  width?: number | undefined;
  height?: number | undefined;
  quality?: number;
  trimWhiteBorder?: boolean;
}

/**
 * 가장자리 여백을 제거합니다. 실패 시 원본 반환.
 * sharp.trim()은 기본적으로 이미지 모서리 색상을 자동 감지합니다.
 */
const tryTrimWhiteBorder = async (imageBuffer: Buffer): Promise<Buffer> => {
  try {
    const trimmed = await sharp(imageBuffer)
      .trim({
        threshold: 40,
      })
      .toBuffer();

    const originalMeta = await sharp(imageBuffer).metadata();
    const trimmedMeta = await sharp(trimmed).metadata();

    if (trimmedMeta.width && trimmedMeta.height &&
        trimmedMeta.width > 10 && trimmedMeta.height > 10) {
      console.log(`✂️ 여백 제거: ${originalMeta.width}x${originalMeta.height} → ${trimmedMeta.width}x${trimmedMeta.height}`);
      return trimmed;
    }

    console.log('⚠️ trim 결과가 너무 작음, 원본 사용');
    return imageBuffer;
  } catch (error) {
    console.log('⚠️ trim 실패, 원본 사용:', error);
    return imageBuffer;
  }
};

export interface ConvertToPngOptions {
  width?: number | undefined;
  height?: number | undefined;
  quality?: number;
}

export const convertToPng = async (
  imageBuffer: Buffer,
  options: ConvertToPngOptions = {}
): Promise<Buffer> => {
  try {
    const { width, height, quality = 9 } = options;

    let sharpImage = sharp(imageBuffer);

    if (width && height) {
      sharpImage = sharpImage.resize(width, height, { fit: 'fill' });
    }

    const pngBuffer = await sharpImage
      .png({ compressionLevel: clamp(quality, 0, 9) })
      .toBuffer();

    return pngBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PNG 변환 실패: ${error.message}`);
    }
    throw new Error('알 수 없는 PNG 변환 오류');
  }
};

export const convertToWebp = async (
  imageBuffer: Buffer,
  options: ConvertToWebpOptions = {}
): Promise<Buffer> => {
  try {
    console.log('🔄✨ WebP 변환 시작한다!! 🚀💫');

    const { width, height, quality = 92, trimWhiteBorder = false } = options;

    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();

    console.log('📸💎 원본 이미지 정보 확인!! 🔍✨', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
    });

    const processedBuffer = trimWhiteBorder
      ? await tryTrimWhiteBorder(imageBuffer)
      : imageBuffer;

    const targetWidth = width || metadata.width;
    const targetHeight = height || metadata.height;

    const webpBuffer = await sharp(processedBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({
        quality: clamp(quality, 1, 100),
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 3,
        alphaQuality: clamp(quality, 1, 100),
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
