import pLimit from 'p-limit';
import { fetchImageBuffer, convertToPng, applyFrame, applyLightDistortion, applyEffects } from '@/utils/image';
import { selectRandomFrame, selectRandomFilter, FilterStyle, FrameStyle } from '@/shared/lib/frame-filter';
import { uploadToS3 } from '@/shared/lib/s3';

const MAX_CONCURRENT = 5;

export interface ImageItem {
  url: string;
}

export interface SearchResult {
  link: string;
}

export interface ProcessImagesOptions {
  useS3: boolean;
  folderName: string;
  useFilter?: boolean;
  distortionLevel?: 'none' | 'light' | 'heavy';
  keepOriginal?: boolean;
}

export interface ProcessImagesResult {
  images: ImageItem[];
  failed: number;
}

export const processImages = async (
  results: SearchResult[],
  targetCount: number,
  currentImages: ImageItem[],
  options: ProcessImagesOptions
): Promise<ProcessImagesResult> => {
  const { useS3, folderName, useFilter = true, distortionLevel = 'heavy', keepOriginal = false } = options;
  const limit = pLimit(MAX_CONCURRENT);
  const images = [...currentImages];
  let failed = 0;
  let successCount = 0;

  const promises = results.map((result, index) =>
    limit(async () => {
      // 이미 목표 달성했으면 스킵
      if (successCount >= targetCount) return null;

      try {
        const frame = selectRandomFrame();
        const filter = useFilter ? selectRandomFilter() : { id: 'none', name: 'None', type: 'none' } as FilterStyle;

        console.log(`🖼️ ${index + 1} 처리 중... (${frame.name}${useFilter ? ` + ${filter.name}` : ''})`);

        const imageBuffer = await fetchImageBuffer(result.link);

        let processedBuffer: Buffer;

        if (distortionLevel === 'heavy') {
          processedBuffer = await applyEffects(imageBuffer, filter, frame, { distortion: true });
        } else if (distortionLevel === 'light') {
          let buffer = await applyFrame(imageBuffer, frame);
          buffer = await applyLightDistortion(buffer);
          processedBuffer = buffer;
        } else {
          processedBuffer = await applyFrame(imageBuffer, frame);
        }

        const pngBuffer = await convertToPng(processedBuffer, {
          quality: 9,
        });

        let url: string;
        if (useS3) {
          const s3Result = await uploadToS3(pngBuffer, folderName, 'image/png');
          url = s3Result.url;
        } else {
          const base64 = pngBuffer.toString('base64');
          url = `data:image/png;base64,${base64}`;
        }

        // 동기적으로 체크하고 push
        if (successCount < targetCount) {
          successCount++;
          images.push({ url });
          console.log(`✅ ${successCount}/${targetCount} 완료`);
        }

        return { success: true };
      } catch (error) {
        console.error(`❌ ${index + 1} 실패:`, error);
        failed++;
        return { success: false };
      }
    })
  );

  await Promise.all(promises);
  return { images, failed };
};
