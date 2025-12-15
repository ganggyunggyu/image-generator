import { useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  searchResultsAtom,
  selectedImagesAtom,
  bulkDownloadLoadingAtom,
  downloadProgressAtom,
  searchErrorAtom,
  searchQueryAtom,
} from '@/entities/image';
import { DownloadOptions } from '@/shared/lib/frame-filter';
import { downloadBlob, getFilenameFromContentDisposition } from '@/utils/browser';
import { sanitizeKeyword } from '@/utils/image/filename';

export const useBulkDownload = () => {
  const [results] = useAtom(searchResultsAtom);
  const [selectedImages, setSelectedImages] = useAtom(selectedImagesAtom);
  const [bulkDownloadLoading, setBulkDownloadLoading] = useAtom(bulkDownloadLoadingAtom);
  const [downloadProgress, setDownloadProgress] = useAtom(downloadProgressAtom);
  const [, setError] = useAtom(searchErrorAtom);
  const [query] = useAtom(searchQueryAtom);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const toggleImageSelection = (index: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      if (newSelected.size >= 30) {
        setError('최대 30개까지만 선택할 수 있습니다');
        return;
      }
      newSelected.add(index);
    }
    setSelectedImages(newSelected);
    setError(null);
  };

  const selectAllImages = () => {
    const maxSelect = Math.min(results.length, 30);
    setSelectedImages(new Set(Array.from({ length: maxSelect }, (_, i) => i)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
    setError(null);
  };

  const getSelectedResults = () => {
    return Array.from(selectedImages)
      .map(index => {
        const result = results[index];
        if (!result) {
          console.error(`❌ Invalid index: ${index}`);
          return null;
        }
        const candidates = [
          result.imageUrl,
          result.previewUrl,
          result.image.thumbnailLink,
          result.link,
        ].filter(Boolean) as string[];

        return {
          url: candidates[0]!,
          fallbackUrls: candidates.slice(1),
          title: result.title,
          width: result.image.width,
          height: result.image.height,
          imageUrl: result.imageUrl,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  const resolveZipFileName = (contentDisposition: string | null) => {
    const parsedFileName = getFilenameFromContentDisposition(contentDisposition);
    const fallbackKeyword = sanitizeKeyword(query) || 'images';
    return parsedFileName || `${fallbackKeyword}.zip`;
  };

  const handleBulkDownloadWithEffects = async (options: DownloadOptions) => {
    const selectedResults = getSelectedResults();

    setDownloadProgress(`효과 적용 중... (${options.frame.name} + ${options.filter.name})`);

    const processedImages = await Promise.all(
      selectedResults.map(async (imageData, index) => {
        try {
          setDownloadProgress(`효과 적용 중... (${index + 1}/${selectedResults.length})`);

          const { applyFrameAndFilterToImage, resolveFrame, resolveFilter } = await import('@/shared/lib/frame-filter');

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

    const response = await fetch('/api/image/bulk-download-processed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        processedImages,
        effectOptions: options,
        keyword: query,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '효과 적용 다운로드에 실패했습니다');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = resolveZipFileName(contentDisposition);
    downloadBlob(blob, fileName);

    setDownloadProgress('완료! 효과 적용된 이미지 다운로드 완료');
  };

  const handleBulkDownloadBasic = async () => {
    const selectedResults = getSelectedResults();

    setDownloadProgress(`${selectedResults.length}개 이미지 다운로드 중...`);

    const response = await fetch('/api/image/bulk-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: selectedResults,
        keyword: query,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌🚨 일괄 다운로드 API 터짐!! 완전 박살났다!! 💀💥', errorData);
      throw new Error(errorData.error || '일괄 다운로드에 실패했습니다');
    }

    setDownloadProgress('ZIP 파일 생성 중...');

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const fileName = resolveZipFileName(contentDisposition);
    downloadBlob(blob, fileName);

    const successCount = response.headers.get('X-Success-Count');
    const failedCount = response.headers.get('X-Failed-Count');

    setDownloadProgress(
      `완료! 성공: ${successCount}개${failedCount && parseInt(failedCount) > 0 ? `, 실패: ${failedCount}개` : ''}`
    );
  };

  const handleBulkDownload = async (options?: DownloadOptions) => {
    if (selectedImages.size === 0) {
      setError('다운로드할 이미지를 선택해주세요');
      return;
    }

    setBulkDownloadLoading(true);
    setDownloadProgress('이미지 준비 중...');

    try {
      if (options && (options.frame.id !== 'none' || options.filter.id !== 'none')) {
        await handleBulkDownloadWithEffects(options);
      } else {
        await handleBulkDownloadBasic();
      }

      clearTimerRef.current = setTimeout(() => {
        setDownloadProgress('');
        setSelectedImages(new Set());
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      setDownloadProgress('');
      console.error('❌💀 일괄 다운로드 오류!! 아이고난!! 🔥😱💥', err);
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  return {
    selectedImages,
    bulkDownloadLoading,
    downloadProgress,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    handleBulkDownload,
  };
};
