import { cn } from '@/shared/lib';

interface SelectionButtonsProps {
  onSelectAll: () => void;
  onClearSelection: () => void;
  disabled: boolean;
}

export const SelectionButtons = ({ onSelectAll, onClearSelection, disabled }: SelectionButtonsProps) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={onSelectAll}
        className={cn(
          'px-3 py-2 bg-gray-600 text-white text-sm rounded',
          'hover:bg-gray-700 transition-colors'
        )}
        disabled={disabled}
      >
        전체선택
      </button>
      <button
        onClick={onClearSelection}
        className={cn(
          'px-3 py-2 bg-gray-400 text-white text-sm rounded',
          'hover:bg-gray-500 transition-colors'
        )}
        disabled={disabled}
      >
        선택해제
      </button>
    </div>
  );
};
