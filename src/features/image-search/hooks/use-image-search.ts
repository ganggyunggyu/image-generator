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

    try {
      const searchUrl = `/api/image/search?q=${encodeURIComponent(query.trim())}&n=${imageCount}&sortOrder=${sortOrder}`;
      const response = await fetch(searchUrl);
      const data: SearchResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || '검색에 실패했습니다');
      }

      if (data.data) {
        console.log(`🚀🔥 검색 결과 개쩐다!! ${data.data.results.length}개 받았음!! 🎯💯 (${sortOrder} 순서) 🌟`);
        setResults(data.data.results);
        setTotalResults(data.data.totalResults);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      console.error('❌💥 아이고난!! 검색 터졌다!! 🔥😱', err);
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

  const removeResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
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
    imageCount,
    setImageCount,
    sortOrder,
    setSortOrder,
    handleSearch,
    handleImageClick,
    handleDownload,
    removeResult,
  };
};