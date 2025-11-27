import { cn } from '@/shared/lib';
import { FILTER_STYLES, FilterStyle } from '@/shared/lib/frame-filter';

interface FilterSelectorProps {
  selectedFilter: FilterStyle;
  onSelectFilter: (filter: FilterStyle) => void;
}

export const FilterSelector = ({ selectedFilter, onSelectFilter }: FilterSelectorProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">필터 효과</h3>
      <div className="grid grid-cols-3 gap-2">
        {FILTER_STYLES.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onSelectFilter(filter)}
            className={cn(
              'p-3 border rounded-lg text-center transition-all',
              'hover:border-emerald-500 hover:bg-emerald-50',
              selectedFilter.id === filter.id
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                : 'border-gray-200'
            )}
          >
            <div className="text-2xl mb-1">{filter.preview}</div>
            <div className="text-xs font-medium text-gray-700">{filter.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
