import React from 'react';
import { cn } from '@/shared/lib';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '로딩 중...',
  className,
}) => {
  return (
    <React.Fragment>
      <div className={cn('text-center mb-8', className)}>
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </React.Fragment>
  );
};