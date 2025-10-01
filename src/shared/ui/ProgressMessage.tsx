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
      <div className={cn('mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg', className)}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <span className="text-green-500 text-lg">✅</span>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};