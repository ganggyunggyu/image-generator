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
      {/* Header - 미니멀 */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-3">
          Image Gallery
        </h1>
        <p className="text-base text-gray-600">
          키워드로 이미지를 검색하고 WebP로 다운로드하세요
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-8">
        <SearchForm
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
          loading={loading}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg p-6 shadow-clean text-center">
          <LoadingSpinner message="이미지를 검색하고 있습니다..." />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-white rounded-lg p-6 shadow-clean border-l-4 border-red-500">
          <ErrorMessage error={error} title="검색 오류" />
        </div>
      )}
    </React.Fragment>
  );
};
