import React from 'react';
import { cn } from '@/shared/lib';

interface ProgressMessageProps {
  message: string;
  isLoading: boolean;
  className?: string;
}

export const ProgressMessage: React.FC<ProgressMessageProps> = ({
  message,
  isLoading,
  className,
}) => {
  return (
    <React.Fragment>
      <div className={cn('mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg', className)}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {isLoading && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
            )}
          </div>
          <div className={cn(isLoading && 'ml-3')}>
            <p className="text-sm text-emerald-800">{message}</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};