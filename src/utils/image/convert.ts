import sharp from 'sharp';
import { clamp } from '@/utils/helpers';

export interface ConvertToWebpOptions {
  width?: number | undefined;
  height?: number | undefined;
  quality?: number;
}

export const convertToWebp = async (
  imageBuffer: Buffer,
  options: ConvertToWebpOptions = {}
): Promise<Buffer> => {
  try {
    console.log('WebP 변환 시작');

    const { width, height, quality = 90 } = options;

    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();

    console.log('원본 이미지 정보:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
    });

    const targetWidth = width || metadata.width;
    const targetHeight = height || metadata.height;

    const webpBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        withoutEnlargement: false,
      })
      .webp({
        quality: clamp(quality, 1, 100),
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 4,
      })
      .toBuffer();

    console.log(`WebP 변환 성공: ${webpBuffer.length} bytes (${targetWidth}x${targetHeight}, quality: ${quality})`);
    return webpBuffer;
  } catch (error) {
    console.error('WebP 변환 실패:', error);

    if (error instanceof Error) {
      throw new Error(`이미지 변환 실패: ${error.message}`);
    }

    throw new Error('알 수 없는 이미지 변환 오류가 발생했습니다');
  }
};
