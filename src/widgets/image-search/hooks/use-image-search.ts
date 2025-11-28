import { useState } from 'react';
import { ImageResult, SearchResponse } from '@/shared/api/types';

export const useImageSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<string>('0');
  const [imageCount, setImageCount] = useState(10);
  const [sortOrder, setSortOrder] = useState<'original' | 'random'>('random');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

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

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    setError,
    totalResults,
    imageCount,
    setImageCount,
    sortOrder,
    setSortOrder,
    handleSearch,
  };
};
