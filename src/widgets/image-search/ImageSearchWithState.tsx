'use client';

import React from 'react';
import { cn } from '@/shared/lib';
import { SearchForm, LoadingSpinner, ErrorMessage } from '@/shared/ui';
import { useImageSearch, useBulkDownload } from '@/features/image-search';
import {
  PetProcessorPanel,
  getPetProcessorPreset,
} from '@/features/pet-processor';
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
  const defaultPetPreset = getPetProcessorPreset();

  return (
    <div className={cn('min-h-screen px-4 py-8')}>
      <div className={cn('mx-auto max-w-6xl')}>
        <SearchHeader />

        <PetProcessorPanel
          currentQuery={query}
          onQuerySelect={setQuery}
        />

        <SearchForm
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
          loading={loading}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          placeholder={defaultPetPreset.placeholder}
        />

        {loading && (
          <LoadingSpinner
            message="이미지를 검색하고 있습니다..."
            progress={validationProgress ?? undefined}
          />
        )}

        {error && <ErrorMessage error={error} title="검색 오류" />}

        {results.length > 0 && (
          <React.Fragment>
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
          </React.Fragment>
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
