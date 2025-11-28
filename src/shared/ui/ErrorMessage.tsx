import React from 'react';
import { cn } from '@/shared/lib';

interface ErrorMessageProps {
  error: string;
  title?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = '오류',
  className,
}) => {
  return (
    <React.Fragment>
      <div className={cn('max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg', className)}>
        <div>
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    </React.Fragment>
  );
};