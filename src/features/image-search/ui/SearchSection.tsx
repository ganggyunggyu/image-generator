import React from 'react';
import { SearchForm, LoadingSpinner, ErrorMessage } from '@/shared/ui';
import { useImageSearch } from '../hooks/use-image-search';

export const SearchSection: React.FC = () => {
  const {
    query,
    setQuery,
    loading,
    error,
    handleSearch,
  } = useImageSearch();

  return (
    <React.Fragment>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🔍 Google Image to PNG
        </h1>
        <p className="text-lg text-gray-600">
          키워드로 이미지를 검색하고 PNG로 다운로드하세요
        </p>
      </div>

      {/* Search Form */}
      <SearchForm
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSearch}
        loading={loading}
      />

      {/* Loading */}
      {loading && <LoadingSpinner message="이미지를 검색하고 있습니다..." />}

      {/* Error */}
      {error && <ErrorMessage error={error} title="검색 오류" />}
    </React.Fragment>
  );
};