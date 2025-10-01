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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </React.Fragment>
  );
};