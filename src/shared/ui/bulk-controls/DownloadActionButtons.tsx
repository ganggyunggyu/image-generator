import { cn } from '@/shared/lib';

interface DownloadActionButtonsProps {
  selectedCount: number;
  onBasicDownload: () => void;
  onShowEffectOptions: () => void;
  bulkDownloadLoading: boolean;
}

export const DownloadActionButtons = ({
  selectedCount,
  onBasicDownload,
  onShowEffectOptions,
  bulkDownloadLoading,
}: DownloadActionButtonsProps) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onBasicDownload}
        disabled={selectedCount === 0 || bulkDownloadLoading}
        className={cn(
          'px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded',
          'hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        )}
      >
        {bulkDownloadLoading ? '처리중...' : `기본 ZIP 다운로드 (${selectedCount}개)`}
      </button>

      <button
        onClick={onShowEffectOptions}
        disabled={selectedCount === 0 || bulkDownloadLoading}
        className={cn(
          'px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded',
          'hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
        )}
      >
        효과 적용 ZIP
      </button>
    </div>
  );
};
