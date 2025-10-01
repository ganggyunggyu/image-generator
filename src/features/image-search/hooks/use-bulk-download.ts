import { useAtom } from 'jotai';
import {
  searchResultsAtom,
  selectedImagesAtom,
  bulkDownloadLoadingAtom,
  downloadProgressAtom,
  searchErrorAtom,
} from '@/entities/image';

export const useBulkDownload = () => {
  const [results] = useAtom(searchResultsAtom);
  const [selectedImages, setSelectedImages] = useAtom(selectedImagesAtom);
  const [bulkDownloadLoading, setBulkDownloadLoading] = useAtom(bulkDownloadLoadingAtom);
  const [downloadProgress, setDownloadProgress] = useAtom(downloadProgressAtom);
  const [, setError] = useAtom(searchErrorAtom);

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
    if (results.length > 30) {
      setSelectedImages(new Set(Array.from({ length: 30 }, (_, i) => i)));
      setError('최대 30개까지만 선택됩니다');
    } else {
      setSelectedImages(new Set(Array.from({ length: results.length }, (_, i) => i)));
      setError(null);
    }
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
    setError(null);
  };

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) {
      setError('다운로드할 이미지를 선택해주세요');
      return;
    }

    setBulkDownloadLoading(true);
    setDownloadProgress('이미지 준비 중...');

    try {
      const selectedResults = Array.from(selectedImages).map(index => ({
        url: results[index].link,
        title: results[index].title,
        width: results[index].image.width,
        height: results[index].image.height,
      }));

      setDownloadProgress(`${selectedResults.length}개 이미지 다운로드 중...`);

      const response = await fetch('/api/image/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: selectedResults,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '일괄 다운로드에 실패했습니다');
      }

      setDownloadProgress('ZIP 파일 생성 중...');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `images_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.zip`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);

      const successCount = response.headers.get('X-Success-Count');
      const failedCount = response.headers.get('X-Failed-Count');

      setDownloadProgress(
        `완료! 성공: ${successCount}개${failedCount && parseInt(failedCount) > 0 ? `, 실패: ${failedCount}개` : ''}`
      );

      setTimeout(() => {
        setDownloadProgress('');
        setSelectedImages(new Set());
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      setDownloadProgress('');
      console.error('일괄 다운로드 오류:', err);
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