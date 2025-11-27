import { cn } from '@/shared/lib';
import { FRAME_STYLES, FILTER_STYLES, FrameStyle, FilterStyle } from '@/shared/lib/frame-filter';

interface EffectOptionsPanelProps {
  selectedFrame: FrameStyle;
  selectedFilter: FilterStyle;
  selectedCount: number;
  onFrameSelect: (frame: FrameStyle) => void;
  onFilterSelect: (filter: FilterStyle) => void;
  onCancel: () => void;
  onConfirm: () => void;
  bulkDownloadLoading: boolean;
}

export const EffectOptionsPanel = ({
  selectedFrame,
  selectedFilter,
  selectedCount,
  onFrameSelect,
  onFilterSelect,
  onCancel,
  onConfirm,
  bulkDownloadLoading,
}: EffectOptionsPanelProps) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-gray-800">일괄 적용할 효과 선택</h4>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 액자 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">액자 스타일</label>
          <div className="grid grid-cols-3 gap-2">
            {FRAME_STYLES.slice(0, 6).map((frame) => (
              <button
                key={frame.id}
                onClick={() => onFrameSelect(frame)}
                className={cn(
                  'p-3 border-2 rounded-lg text-center transition-all',
                  'hover:shadow-md',
                  selectedFrame.id === frame.id
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                )}
              >
                <div className="text-xl mb-1">{frame.preview}</div>
                <div className="text-xs font-medium text-gray-700">{frame.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 필터 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">필터 효과</label>
          <div className="grid grid-cols-3 gap-2">
            {FILTER_STYLES.slice(0, 6).map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterSelect(filter)}
                className={cn(
                  'p-3 border-2 rounded-lg text-center transition-all',
                  'hover:shadow-md',
                  selectedFilter.id === filter.id
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                )}
              >
                <div className="text-xl mb-1">{filter.preview}</div>
                <div className="text-xs font-medium text-gray-700">{filter.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors rounded-lg hover:bg-gray-100"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={bulkDownloadLoading}
          className={cn(
            'px-8 py-3 bg-emerald-600 text-white text-base font-semibold rounded-lg',
            'hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg'
          )}
        >
          효과 적용 다운로드 ({selectedCount}개)
        </button>
      </div>
    </div>
  );
};
