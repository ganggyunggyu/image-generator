'use client';

import React from 'react';
import { SearchForm, LoadingSpinner, ErrorMessage } from '@/shared/ui';
import { DownloadOptions } from '@/shared/lib/frame-filter';
import { useImageSearch } from './hooks/use-image-search';
import { useImageSelection } from './hooks/use-image-selection';
import { useBulkDownload } from './hooks/use-bulk-download';
import { SearchHeader, ResultsHeader, EmptyState, ResultsGrid } from './ui';

export const ImageSearchWithState: React.FC = () => {
  const {
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
  } = useImageSearch();

  const {
    selectedImages,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    setSelectedImages,
  } = useImageSelection(results.length);

  const { bulkDownloadLoading, downloadProgress, handleBulkDownload } =
    useBulkDownload();

  const handleToggleSelection = (index: number) => {
    const errorMsg = toggleImageSelection(index);
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setError(null);
    }
  };

  const handleSelectAll = () => {
    const errorMsg = selectAllImages();
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setError(null);
    }
  };

  const handleClearSelection = () => {
    clearSelection();
    setError(null);
  };

  const handleBulkDownloadWrapper = async (options?: DownloadOptions) => {
    const errorMsg = await handleBulkDownload(
      { selectedImages, results, query },
      options
    );

    if (errorMsg) {
      setError(errorMsg);
    } else {
      setTimeout(() => {
        setSelectedImages(new Set());
      }, 3000);
    }
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    console.log('👆✨ 이미지 클릭했다!! 🎨🔥', title, '🌐', imageUrl);
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

        {loading && <LoadingSpinner message="이미지를 검색하고 있습니다..." />}

        {error && <ErrorMessage error={error} title="검색 오류" />}

        {results.length > 0 && (
          <>
            <ResultsHeader
              totalResults={totalResults}
              resultsCount={results.length}
              selectedCount={selectedImages.size}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkDownload={handleBulkDownloadWrapper}
              bulkDownloadLoading={bulkDownloadLoading}
              downloadProgress={downloadProgress}
            />

            <ResultsGrid
              results={results}
              selectedImages={selectedImages}
              onToggleSelect={handleToggleSelection}
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
