import React from 'react';
import { cn } from '@/shared/lib';

interface SearchFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  sortOrder?: 'original' | 'random';
  onSortOrderChange?: (order: 'original' | 'random') => void;
  className?: string;
  placeholder?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  query,
  onQueryChange,
  onSubmit,
  loading,
  sortOrder = 'original',
  onSortOrderChange,
  className,
  placeholder = '검색어를 입력하세요',
}) => {
  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  const handleOriginalOrderClick = () => {
    onSortOrderChange?.('original');
  };

  const handleRandomOrderClick = () => {
    onSortOrderChange?.('random');
  };

  return (
    <form onSubmit={onSubmit} className={cn('relative z-10 mx-auto max-w-4xl', className)}>
      <div className={cn('space-y-4')}>
        <div className={cn('flex flex-col gap-3 sm:flex-row')}>
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={placeholder}
            className={cn(
              'flex-1 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400',
              'transition-colors focus:border-emerald-500 focus:outline-none'
            )}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={cn(
              'rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition-colors',
              'hover:bg-emerald-600',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </div>

        {sortOrder !== undefined && onSortOrderChange && (
          <div className={cn('flex items-center justify-center gap-3 text-sm')}>
            <div className={cn('flex items-center gap-2')}>
              <span className={cn('font-medium text-gray-700')}>순서:</span>
              <div className={cn('flex gap-1')}>
                <button
                  type="button"
                  onClick={handleOriginalOrderClick}
                  disabled={loading}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors',
                    sortOrder === 'original'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  순서대로
                </button>
                <button
                  type="button"
                  onClick={handleRandomOrderClick}
                  disabled={loading}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors',
                    sortOrder === 'random'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  랜덤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};
