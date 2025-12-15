import { useState } from 'react';
import { useAtom } from 'jotai';
import {
  searchQueryAtom,
  searchResultsAtom,
  searchLoadingAtom,
  searchErrorAtom,
  totalResultsAtom,
  selectedImagesAtom,
  downloadProgressAtom,
  imageCountAtom,
  sortOrderAtom,
} from '@/entities/image';
import { SearchResponse } from '@/shared/api/types';
import { validateImages } from '@/utils/image/validate-browser';

export const useImageSearch = () => {
  const [query, setQuery] = useAtom(searchQueryAtom);
  const [results, setResults] = useAtom(searchResultsAtom);
  const [loading, setLoading] = useAtom(searchLoadingAtom);
  const [error, setError] = useAtom(searchErrorAtom);
  const [totalResults, setTotalResults] = useAtom(totalResultsAtom);
  const [selectedImages, setSelectedImages] = useAtom(selectedImagesAtom);
  const [downloadProgress, setDownloadProgress] = useAtom(downloadProgressAtom);
  const [imageCount, setImageCount] = useAtom(imageCountAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);
  const [validationProgress, setValidationProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedImages(new Set());
    setDownloadProgress('');
    setValidationProgress(null);

    try {
      const searchUrl = `/api/image/search?q=${encodeURIComponent(query.trim())}&n=${imageCount}&sortOrder=${sortOrder}`;
      const response = await fetch(searchUrl);
      const data: SearchResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || '검색에 실패했습니다');
      }

      if (data.data) {
        setTotalResults(data.data.totalResults);
        setValidationProgress({ current: 0, total: imageCount });

        const validImages = await validateImages(
          data.data.results,
          imageCount,
          (current, total) => {
            setValidationProgress({ current, total });
          }
        );

        setResults(validImages);
        setValidationProgress(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9가-힣\s]/g, '')}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    setError,
    totalResults,
    selectedImages,
    downloadProgress,
    validationProgress,
    imageCount,
    setImageCount,
    sortOrder,
    setSortOrder,
    handleSearch,
    handleImageClick,
    handleDownload,
  };
};
