import { BulkControls, ProgressMessage } from '@/shared/ui';
import { DownloadOptions } from '@/shared/lib/frame-filter';

interface ResultsHeaderProps {
  totalResults: string;
  resultsCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDownload: (options?: DownloadOptions) => void;
  bulkDownloadLoading: boolean;
  downloadProgress: string;
}

export const ResultsHeader = ({
  totalResults,
  resultsCount,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkDownload,
  bulkDownloadLoading,
  downloadProgress,
}: ResultsHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            검색 결과
          </h2>
          <p className="text-gray-600">
            총 {parseInt(totalResults).toLocaleString()}개 중 {resultsCount}개 표시
          </p>
        </div>

        <BulkControls
          selectedCount={selectedCount}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          onBulkDownload={onBulkDownload}
          bulkDownloadLoading={bulkDownloadLoading}
        />
      </div>

      {downloadProgress && (
        <ProgressMessage
          message={downloadProgress}
          isLoading={bulkDownloadLoading}
        />
      )}

      {selectedCount > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            {selectedCount}개 이미지 선택됨 (최대 30개)
          </p>
        </div>
      )}
    </div>
  );
};
