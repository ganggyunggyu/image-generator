import { useState, useEffect } from 'react';
import {
  FRAME_STYLES,
  FILTER_STYLES,
  FrameStyle,
  FilterStyle,
  DownloadOptions,
  applyFrameAndFilterToImage
} from '@/shared/lib/frame-filter';

export const useDownloadModal = (imageUrl: string, imageName: string, isOpen: boolean) => {
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>(FRAME_STYLES[0]!);
  const [selectedFilter, setSelectedFilter] = useState<FilterStyle>(FILTER_STYLES[0]!);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 미리보기 업데이트
  useEffect(() => {
    if (!isOpen) return;

    const updatePreview = async () => {
      try {
        setPreviewLoading(true);
        const options: DownloadOptions = {
          frame: selectedFrame,
          filter: selectedFilter,
          quality: 0.8,
        };

        const preview = await applyFrameAndFilterToImage(imageUrl, options, 300);
        setPreviewUrl(preview);
      } catch (error) {
        console.error('미리보기 생성 실패:', error);
      } finally {
        setPreviewLoading(false);
      }
    };

    updatePreview();
  }, [selectedFrame, selectedFilter, imageUrl, isOpen]);

  const handleDownload = async (withEffects: boolean = true) => {
    try {
      setIsProcessing(true);

      let finalImageUrl: string;
      let fileName: string;

      if (withEffects && (selectedFrame.id !== 'none' || selectedFilter.id !== 'none')) {
        const options: DownloadOptions = {
          frame: selectedFrame,
          filter: selectedFilter,
          quality: 1.0,
        };

        finalImageUrl = await applyFrameAndFilterToImage(imageUrl, options, 1200);
        fileName = `${imageName}_${selectedFrame.id}_${selectedFilter.id}.webp`;
      } else {
        finalImageUrl = imageUrl;
        fileName = `${imageName}_original.webp`;
      }

      const link = document.createElement('a');
      link.href = finalImageUrl;
      link.download = fileName.replace(/[^a-zA-Z0-9가-힣\s]/g, '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`다운로드 완료: ${fileName}`);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    selectedFrame,
    setSelectedFrame,
    selectedFilter,
    setSelectedFilter,
    previewUrl,
    isProcessing,
    previewLoading,
    handleDownload,
  };
};
