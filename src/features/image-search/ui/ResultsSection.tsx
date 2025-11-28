import React from 'react';
import { BulkControls, ProgressMessage, ImageCard } from '@/shared/ui';
import { useImageSearch } from '../hooks/use-image-search';
import { useBulkDownload } from '../hooks/use-bulk-download';
import { cn } from '@/shared/lib';

export const ResultsSection: React.FC = () => {
  const {
    results,
    totalResults,
    query,
    loading,
    error,
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

  if (results.length === 0) {
    if (!loading && !error && query) {
      return (
        <React.Fragment>
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              다른 키워드로 검색해보세요
            </p>
          </div>
        </React.Fragment>
      );
    }

    if (!loading && !error && !query) {
      return (
        <React.Fragment>
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              이미지를 검색해보세요
            </h3>
            <p className="text-gray-600">
              키워드를 입력하고 검색 버튼을 눌러주세요
            </p>
          </div>
        </React.Fragment>
      );
    }

    return null;
  }

  return (
    <React.Fragment>
      {/* Results Header */}
      <div className="mb-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          검색 결과
        </h2>

        {/* 일괄 선택 컨트롤 */}
        <BulkControls
          selectedCount={selectedImages.size}
          onSelectAll={selectAllImages}
          onClearSelection={clearSelection}
          onBulkDownload={handleBulkDownload}
          bulkDownloadLoading={bulkDownloadLoading}
        />

        {/* 다운로드 진행상태 */}
        {downloadProgress && (
          <ProgressMessage
            message={downloadProgress}
            isLoading={bulkDownloadLoading}
          />
        )}

        {selectedImages.size > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-800">
              {selectedImages.size}개 이미지 선택됨 (최대 30개)
            </p>
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className={cn(
        'grid gap-6',
        'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      )}>
        {results.map((result, index) => (
          <ImageCard
            key={index}
            image={result}
            index={index}
            isSelected={selectedImages.has(index)}
            onToggleSelect={toggleImageSelection}
            onImageClick={handleImageClick}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </React.Fragment>
  );
};