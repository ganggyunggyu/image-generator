import { useState, useRef, useEffect } from 'react';
import { ImageResult } from '@/shared/api/types';
import { DownloadOptions } from '@/shared/lib/frame-filter';
import { downloadBlob, generateTimestampFilename } from '@/utils/browser';

interface BulkDownloadParams {
  selectedImages: Set<number>;
  results: ImageResult[];
  query: string;
}

export const useBulkDownload = () => {
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);


  const handleBulkDownloadWithEffects = async (
    params: BulkDownloadParams,
    options: DownloadOptions
  ) => {
    const { selectedImages, results, query } = params;
    const selectedResults = Array.from(selectedImages)
      .map(index => {
        const result = results[index];
        if (!result) {
          console.error(`❌ Invalid index: ${index}`);
          return null;
        }
        return {
          url: result.link,
          title: result.title,
          width: result.image.width,
          height: result.image.height,
          imageUrl: result.imageUrl,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    setDownloadProgress(`효과 적용 중... (${options.frame.name} + ${options.filter.name})`);

    const processedImages = await Promise.all(
      selectedResults.map(async (imageData, index) => {
        try {
          setDownloadProgress(`효과 적용 중... (${index + 1}/${selectedResults.length})`);

          const { applyFrameAndFilterToImage, resolveFrame, resolveFilter } = await import('@/shared/lib/frame-filter');

          // 랜덤 액자/필터 선택
          const actualFrame = resolveFrame(options.frame);
          const actualFilter = resolveFilter(options.filter);

          const actualOptions = {
            ...options,
            frame: actualFrame,
            filter: actualFilter,
          };

          const processedDataUrl = await applyFrameAndFilterToImage(imageData.imageUrl, actualOptions, 1200);

          return {
            ...imageData,
            processedDataUrl,
          };
        } catch (error) {
          console.error(`❌💥 효과 적용 실패했다 ㅅㅂ!! 😭🔥 ${imageData.title}`, error);
          return imageData;
        }
      })
    );

    setDownloadProgress('ZIP 파일 생성 중...');

    const requestBody = {
      processedImages,
      effectOptions: options,
      keyword: query,
    };

    const response = await fetch('/api/image/bulk-download-processed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '효과 적용 다운로드에 실패했습니다');
    }

    const blob = await response.blob();
    const fileName = generateTimestampFilename('images_with_effects');
    downloadBlob(blob, fileName);

    setDownloadProgress('완료! 효과 적용된 이미지 다운로드 완료');
  };

  const handleBulkDownloadBasic = async (params: BulkDownloadParams) => {
    const { selectedImages, results, query } = params;
    const selectedResults = Array.from(selectedImages)
      .map(index => {
        const result = results[index];
        if (!result) {
          console.error(`❌ Invalid index: ${index}`);
          return null;
        }
        return {
          url: result.link,
          title: result.title,
          width: result.image.width,
          height: result.image.height,
          imageUrl: result.imageUrl,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    setDownloadProgress(`${selectedResults.length}개 이미지 다운로드 중...`);

    const requestBody = {
      images: selectedResults,
      keyword: query,
    };

    const response = await fetch('/api/image/bulk-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌🚨 일괄 다운로드 API 터짐!! 완전 박살났다!! 💀💥', errorData);
      throw new Error(errorData.error || '일괄 다운로드에 실패했습니다');
    }

    setDownloadProgress('ZIP 파일 생성 중...');

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = contentDisposition
      ? (contentDisposition.split('filename=')[1]?.replace(/"/g, '') || generateTimestampFilename('images'))
      : generateTimestampFilename('images');

    downloadBlob(blob, fileName);

    const successCount = response.headers.get('X-Success-Count');
    const failedCount = response.headers.get('X-Failed-Count');

    setDownloadProgress(
      `완료! 성공: ${successCount}개${failedCount && parseInt(failedCount) > 0 ? `, 실패: ${failedCount}개` : ''}`
    );
  };

  const handleBulkDownload = async (
    params: BulkDownloadParams,
    options?: DownloadOptions
  ): Promise<string | null> => {
    if (params.selectedImages.size === 0) {
      return '다운로드할 이미지를 선택해주세요';
    }

    setBulkDownloadLoading(true);
    setDownloadProgress('이미지 준비 중...');

    try {
      if (options && (options.frame.id !== 'none' || options.filter.id !== 'none')) {
        await handleBulkDownloadWithEffects(params, options);
      } else {
        await handleBulkDownloadBasic(params);
      }

      clearTimerRef.current = setTimeout(() => {
        setDownloadProgress('');
      }, 3000);

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setDownloadProgress('');
      console.error('❌💀 일괄 다운로드 오류!! 아이고난!! 🔥😱💥', err);
      return errorMessage;
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  return {
    bulkDownloadLoading,
    downloadProgress,
    handleBulkDownload,
  };
};
