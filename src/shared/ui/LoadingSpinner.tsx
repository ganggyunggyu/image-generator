import React from 'react';
import { cn } from '@/shared/lib';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  progress?: {
    current: number;
    total: number;
  } | undefined;
}

const LOADING_EMOJIS = ['🔍', '🖼️', '✨', '🎨', '📸'] as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '로딩 중...',
  className,
  progress,
}) => {
  const hasProgress = progress && progress.total > 0;
  const percent = hasProgress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;
  const emojiIndex = hasProgress
    ? Math.min(Math.floor((progress.current / progress.total) * LOADING_EMOJIS.length), LOADING_EMOJIS.length - 1)
    : 0;
  const currentEmoji = LOADING_EMOJIS[emojiIndex];

  return (
    <div className={cn('text-center mb-8', className)}>
      {/* 스피너 */}
      <div className="inline-flex items-center justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200" />
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          {hasProgress && (
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-bounce">
              {currentEmoji}
            </div>
          )}
        </div>
      </div>

      {/* 프로그래스 바 */}
      {hasProgress && (
        <div className="max-w-xs mx-auto mb-3">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span className="font-medium">{progress.current} / {progress.total}</span>
            <span className="font-bold text-emerald-600">{percent}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* 메시지 */}
      <p className="text-gray-600 font-medium">
        {hasProgress ? '이미지 검증 중...' : message}
      </p>

      {/* 진행 힌트 */}
      {hasProgress && progress.current > 0 && (
        <p className="text-xs text-gray-400 mt-1 animate-pulse">
          로드 가능한 이미지만 골라내는 중 💪
        </p>
      )}
    </div>
  );
};
