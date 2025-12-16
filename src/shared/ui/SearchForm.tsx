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
}

export const SearchForm: React.FC<SearchFormProps> = ({
  query,
  onQueryChange,
  onSubmit,
  loading,
  sortOrder = 'original',
  onSortOrderChange,
  className,
}) => {
  return (
    <React.Fragment>
      <form onSubmit={onSubmit} className={cn('max-w-4xl mx-auto relative z-10', className)}>
        <div className="space-y-4">
          {/* 메인 검색창 */}
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="검색어를 입력하세요"
              className={cn(
                'flex-1 px-4 py-3 text-base rounded-lg',
                'bg-white border-2 border-gray-200',
                'focus:outline-none focus:border-emerald-500',
                'transition-colors',
                'text-gray-900 placeholder-gray-400'
              )}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={cn(
                'px-6 py-3 rounded-lg text-base font-semibold',
                'bg-emerald-500 text-white',
                'hover:bg-emerald-600',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {loading ? '검색중...' : '검색'}
            </button>
          </div>

          {/* 정렬 순서 선택 */}
          {sortOrder !== undefined && onSortOrderChange && (
            <div className="flex gap-3 items-center justify-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">순서:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onSortOrderChange('original')}
                    disabled={loading}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                      sortOrder === 'original'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    순서대로
                  </button>
                  <button
                    type="button"
                    onClick={() => onSortOrderChange('random')}
                    disabled={loading}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                      sortOrder === 'random'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
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
    </React.Fragment>
  );
};
