'use client';

import React from 'react';
import { SearchForm, LoadingSpinner, ErrorMessage } from '@/shared/ui';
import { useImageSearch, useBulkDownload } from '@/features/image-search';
import { SearchHeader, ResultsHeader, EmptyState, ResultsGrid } from './ui';

export const ImageSearchWithState: React.FC = () => {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    totalResults,
    validationProgress,
    imageCount,
    setImageCount,
    sortOrder,
    setSortOrder,
    handleSearch,
    handleImageClick,
    handleDownload,
  } = useImageSearch();

  const {
    selectedImages,
    bulkDownloadLoading,
    downloadProgress,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    handleBulkDownload,
  } = useBulkDownload();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <SearchHeader />

        <SearchForm
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
          loading={loading}
          imageCount={imageCount}
          onImageCountChange={setImageCount}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {loading && (
          <LoadingSpinner
            message={validationProgress || '이미지를 검색하고 있습니다...'}
          />
        )}

        {error && <ErrorMessage error={error} title="검색 오류" />}

        {results.length > 0 && (
          <>
            <ResultsHeader
              totalResults={totalResults}
              resultsCount={results.length}
              selectedCount={selectedImages.size}
              onSelectAll={selectAllImages}
              onClearSelection={clearSelection}
              onBulkDownload={handleBulkDownload}
              bulkDownloadLoading={bulkDownloadLoading}
              downloadProgress={downloadProgress}
            />

            <ResultsGrid
              results={results}
              selectedImages={selectedImages}
              onToggleSelect={toggleImageSelection}
              onImageClick={handleImageClick}
              onDownload={handleDownload}
            />
          </>
        )}

        {!loading && !error && results.length === 0 && query && (
          <EmptyState type="no-results" />
        )}

        {!loading && !error && results.length === 0 && !query && (
          <EmptyState type="initial" />
        )}
      </div>
    </div>
  );
};
