import { cn } from '@/shared/lib';

interface DownloadButtonsProps {
  onDownloadOriginal: () => void;
  onDownloadWithEffects: () => void;
  isProcessing: boolean;
  previewLoading: boolean;
}

export const DownloadButtons = ({
  onDownloadOriginal,
  onDownloadWithEffects,
  isProcessing,
  previewLoading,
}: DownloadButtonsProps) => {
  return (
    <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end">
      <button
        onClick={onDownloadOriginal}
        disabled={isProcessing}
        className={cn(
          'px-6 py-2 border border-gray-300 text-gray-700 rounded-lg',
          'hover:bg-gray-50 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        원본 다운로드
      </button>

      <button
        onClick={onDownloadWithEffects}
        disabled={isProcessing || previewLoading}
        className={cn(
          'px-6 py-2 bg-emerald-600 text-white rounded-lg',
          'hover:bg-emerald-700 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            처리 중...
          </>
        ) : (
          '효과 적용 다운로드'
        )}
      </button>
    </div>
  );
};
