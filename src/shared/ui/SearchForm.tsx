import React from 'react';
import { cn } from '@/shared/lib';

interface SearchFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  sortOrder: 'original' | 'random';
  onSortOrderChange: (order: 'original' | 'random') => void;
  className?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  query,
  onQueryChange,
  onSubmit,
  loading,
  imageCount,
  onImageCountChange,
  sortOrder,
  onSortOrderChange,
  className,
}) => {
  return (
    <React.Fragment>
      <form onSubmit={onSubmit} className={cn('mb-8', className)}>
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 메인 검색창 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="검색어를 입력하세요 (예: 고양이, 자연, 음식)"
              className={cn(
                'flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'text-gray-900'
              )}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={cn(
                'px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg',
                'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                'sm:w-auto w-full'
              )}
            >
              {loading ? '검색중...' : '검색'}
            </button>
          </div>

          {/* 검색 옵션 */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {/* 이미지 개수 선택 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                개수:
              </label>
              <select
                value={imageCount}
                onChange={(e) => onImageCountChange(Number(e.target.value))}
                disabled={loading}
                className={cn(
                  'px-3 py-2 border border-gray-300 rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'text-gray-900 bg-white'
                )}
              >
                <option value={5}>5개</option>
                <option value={10}>10개</option>
                <option value={15}>15개</option>
                <option value={20}>20개</option>
                <option value={30}>30개</option>
              </select>
            </div>

            {/* 정렬 순서 선택 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                순서:
              </label>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => onSortOrderChange('original')}
                  disabled={loading}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    sortOrder === 'original'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50',
                    'disabled:opacity-50'
                  )}
                >
                  순서대로
                </button>
                <button
                  type="button"
                  onClick={() => onSortOrderChange('random')}
                  disabled={loading}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    sortOrder === 'random'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50',
                    'disabled:opacity-50'
                  )}
                >
                  🎲 랜덤
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </React.Fragment>
  );
};