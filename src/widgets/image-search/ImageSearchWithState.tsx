'use client';

import React from 'react';
import { SearchForm, LoadingSpinner, ErrorMessage, BulkControls, ProgressMessage, ImageCard } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { ImageResult, SearchResponse } from '@/shared/api/types';
import { DownloadOptions } from '@/shared/lib/frame-filter';

export const ImageSearchWithState: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ImageResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [totalResults, setTotalResults] = React.useState<string>('0');
  const [selectedImages, setSelectedImages] = React.useState<Set<number>>(new Set());
  const [bulkDownloadLoading, setBulkDownloadLoading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState<string>('');
  const [imageCount, setImageCount] = React.useState(10);
  const [sortOrder, setSortOrder] = React.useState<'original' | 'random'>('random');

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
        console.log(`검색 결과 수신: ${data.data.results.length}개 (${sortOrder} 순서)`);
        setResults(data.data.results);
        setTotalResults(data.data.totalResults);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      console.error('검색 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (pngUrl: string, title: string) => {
    console.log('이미지 클릭:', title, pngUrl);
    window.open(pngUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (pngUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9가-힣\s]/g, '')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleImageSelection = (index: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      if (newSelected.size >= 30) {
        setError('최대 30개까지만 선택할 수 있습니다');
        return;
      }
      newSelected.add(index);
    }
    setSelectedImages(newSelected);
    setError(null);
  };

  const selectAllImages = () => {
    if (results.length > 30) {
      setSelectedImages(new Set(Array.from({ length: 30 }, (_, i) => i)));
      setError('최대 30개까지만 선택됩니다');
    } else {
      setSelectedImages(new Set(Array.from({ length: results.length }, (_, i) => i)));
      setError(null);
    }
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
    setError(null);
  };

  const handleBulkDownload = async (options?: DownloadOptions) => {
    if (selectedImages.size === 0) {
      setError('다운로드할 이미지를 선택해주세요');
      return;
    }

    setBulkDownloadLoading(true);
    setDownloadProgress('이미지 준비 중...');

    try {
      const selectedResults = Array.from(selectedImages).map(index => ({
        url: results[index].link,
        title: results[index].title,
        width: results[index].image.width,
        height: results[index].image.height,
        pngUrl: results[index].pngUrl, // 프록시 URL 추가
      }));

      // 효과 적용이 있는 경우 클라이언트에서 미리 처리
      if (options && (options.frame.id !== 'none' || options.filter.id !== 'none')) {
        setDownloadProgress(`효과 적용 중... (${options.frame.name} + ${options.filter.name})`);

        // 클라이언트에서 효과 적용
        const processedImages = await Promise.all(
          selectedResults.map(async (imageData, index) => {
            try {
              setDownloadProgress(`효과 적용 중... (${index + 1}/${selectedResults.length})`);

              const { applyFrameAndFilterToImage } = await import('@/shared/lib/frame-filter');
              const processedDataUrl = await applyFrameAndFilterToImage(imageData.pngUrl, options, 1200);

              return {
                ...imageData,
                processedDataUrl, // 효과 적용된 데이터 URL
              };
            } catch (error) {
              console.error(`효과 적용 실패: ${imageData.title}`, error);
              return imageData; // 실패 시 원본 사용
            }
          })
        );

        setDownloadProgress('ZIP 파일 생성 중...');

        // 효과 적용된 이미지들을 서버로 전송
        const requestBody = {
          processedImages,
          effectOptions: options,
          keyword: query,
        };

        const response = await fetch('/api/image/bulk-download-processed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '효과 적용 다운로드에 실패했습니다');
        }

        // ZIP 다운로드 처리
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const fileName = `images_with_effects_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.zip`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(downloadUrl);

        setDownloadProgress('완료! 효과 적용된 이미지 다운로드 완료');

      } else {
        // 기본 다운로드 (기존 방식)
        setDownloadProgress(`${selectedResults.length}개 이미지 다운로드 중...`);

        const requestBody = {
          images: selectedResults,
          keyword: query,
        };

        const response = await fetch('/api/image/bulk-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('일괄 다운로드 API 에러:', errorData);
          throw new Error(errorData.error || '일괄 다운로드에 실패했습니다');
        }

        setDownloadProgress('ZIP 파일 생성 중...');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const contentDisposition = response.headers.get('Content-Disposition');
        const fileName = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `images_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.zip`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(downloadUrl);

        const successCount = response.headers.get('X-Success-Count');
        const failedCount = response.headers.get('X-Failed-Count');

        setDownloadProgress(
          `완료! 성공: ${successCount}개${failedCount && parseInt(failedCount) > 0 ? `, 실패: ${failedCount}개` : ''}`
        );
      }

      setTimeout(() => {
        setDownloadProgress('');
        setSelectedImages(new Set());
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      setDownloadProgress('');
      console.error('일괄 다운로드 오류:', err);
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  return (
    <React.Fragment>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
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
            imageCount={imageCount}
            onImageCountChange={setImageCount}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          {/* Loading */}
          {loading && <LoadingSpinner message="이미지를 검색하고 있습니다..." />}

          {/* Error */}
          {error && <ErrorMessage error={error} title="검색 오류" />}

          {/* Results */}
          {results.length > 0 && (
            <React.Fragment>
              {/* Results Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      검색 결과
                    </h2>
                    <p className="text-gray-600">
                      총 {parseInt(totalResults).toLocaleString()}개 중 {results.length}개 표시
                    </p>
                  </div>

                  {/* 일괄 선택 컨트롤 */}
                  <BulkControls
                    selectedCount={selectedImages.size}
                    onSelectAll={selectAllImages}
                    onClearSelection={clearSelection}
                    onBulkDownload={handleBulkDownload}
                    bulkDownloadLoading={bulkDownloadLoading}
                  />
                </div>

                {/* 다운로드 진행상태 */}
                {downloadProgress && (
                  <ProgressMessage
                    message={downloadProgress}
                    isLoading={bulkDownloadLoading}
                  />
                )}

                {selectedImages.size > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
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
          )}

          {/* No Results */}
          {!loading && !error && results.length === 0 && query && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-gray-600">
                다른 키워드로 검색해보세요
              </p>
            </div>
          )}

          {/* Initial State */}
          {!loading && !error && results.length === 0 && !query && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                이미지를 검색해보세요
              </h3>
              <p className="text-gray-600">
                키워드를 입력하고 검색 버튼을 눌러주세요
              </p>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};