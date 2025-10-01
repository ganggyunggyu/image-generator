import React from 'react';
import { cn } from '@/shared/lib';
import {
  FRAME_STYLES,
  FILTER_STYLES,
  FrameStyle,
  FilterStyle,
  DownloadOptions
} from '@/shared/lib/frame-filter';

interface BulkControlsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDownload: (options?: DownloadOptions) => void;
  bulkDownloadLoading: boolean;
  className?: string;
}

export const BulkControls: React.FC<BulkControlsProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkDownload,
  bulkDownloadLoading,
  className,
}) => {
  const [showEffectOptions, setShowEffectOptions] = React.useState(false);
  const [selectedFrame, setSelectedFrame] = React.useState<FrameStyle>(FRAME_STYLES[0]);
  const [selectedFilter, setSelectedFilter] = React.useState<FilterStyle>(FILTER_STYLES[0]);

  const handleBasicDownload = () => {
    onBulkDownload(); // 기존 방식 (옵션 없음)
  };

  const handleEffectDownload = () => {
    const options: DownloadOptions = {
      frame: selectedFrame,
      filter: selectedFilter,
      quality: 1.0,
    };
    onBulkDownload(options);
  };

  return (
    <React.Fragment>
      <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className={cn(
              'px-3 py-2 bg-gray-600 text-white text-sm rounded',
              'hover:bg-gray-700 transition-colors'
            )}
            disabled={bulkDownloadLoading}
          >
            전체선택
          </button>
          <button
            onClick={onClearSelection}
            className={cn(
              'px-3 py-2 bg-gray-400 text-white text-sm rounded',
              'hover:bg-gray-500 transition-colors'
            )}
            disabled={bulkDownloadLoading}
          >
            선택해제
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBasicDownload}
            disabled={selectedCount === 0 || bulkDownloadLoading}
            className={cn(
              'px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded',
              'hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            )}
          >
            {bulkDownloadLoading ? '처리중...' : `기본 ZIP 다운로드 (${selectedCount}개)`}
          </button>

          <button
            onClick={() => setShowEffectOptions(!showEffectOptions)}
            disabled={selectedCount === 0 || bulkDownloadLoading}
            className={cn(
              'px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-medium rounded',
              'hover:from-pink-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
            )}
          >
            🎨 효과 적용 ZIP
          </button>
        </div>
      </div>

      {/* 효과 옵션 패널 */}
      {showEffectOptions && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-800 mb-3">🎨 일괄 적용할 효과 선택</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 액자 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🖼️ 액자</label>
              <div className="grid grid-cols-3 gap-1">
                {FRAME_STYLES.slice(0, 6).map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={cn(
                      'p-2 border rounded text-center transition-all text-xs',
                      selectedFrame.id === frame.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    )}
                  >
                    <div className="text-lg">{frame.preview}</div>
                    <div className="text-xs text-gray-600">{frame.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 필터 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🎨 필터</label>
              <div className="grid grid-cols-3 gap-1">
                {FILTER_STYLES.slice(0, 6).map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={cn(
                      'p-2 border rounded text-center transition-all text-xs',
                      selectedFilter.id === filter.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    )}
                  >
                    <div className="text-lg">{filter.preview}</div>
                    <div className="text-xs text-gray-600">{filter.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowEffectOptions(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleEffectDownload}
              disabled={bulkDownloadLoading}
              className={cn(
                'px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-medium rounded',
                'hover:from-pink-600 hover:to-violet-600 disabled:opacity-50 transition-all'
              )}
            >
              ✨ 효과 적용 다운로드 ({selectedCount}개)
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};