import pLimit from 'p-limit';
import { uploadToS3 } from '@/shared/lib/s3';
import { applyLightDistortion, convertToPng } from '@/utils/image';
import { MAX_CONCURRENT_PROCESSES } from './constants';

interface ProcessAiImagesParams {
  distort: boolean;
  imageUrls: string[];
  keyword: string;
}

type ProcessSingleImageParams = {
  distort: boolean;
  imageUrl: string;
  keyword: string;
};

const processSingleImage = async ({
  distort,
  imageUrl,
  keyword,
}: ProcessSingleImageParams): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`fetch failed: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const distorted = distort ? await applyLightDistortion(buffer) : buffer;
    const pngBuffer = await convertToPng(distorted);
    const { url } = await uploadToS3(pngBuffer, `ai-processed/${keyword}`, 'image/png');

    return url;
  } catch (error) {
    console.error(`❌ 처리 실패: ${imageUrl}`, error);
    return null;
  }
};

export const processAiImages = async ({
  distort,
  imageUrls,
  keyword,
}: ProcessAiImagesParams): Promise<{ bodyImages: string[]; failed: number }> => {
  const limit = pLimit(MAX_CONCURRENT_PROCESSES);
  const results = await Promise.all(
    imageUrls.map((imageUrl) =>
      limit(() =>
        processSingleImage({
          distort,
          imageUrl,
          keyword,
        })
      )
    )
  );

  const bodyImages = results.filter((url): url is string => url !== null);

  return {
    bodyImages,
    failed: results.length - bodyImages.length,
  };
};
