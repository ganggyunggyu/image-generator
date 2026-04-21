/* eslint-disable @next/next/no-img-element -- previewUrl 은 blob/object URL 이 들어올 수 있음 */
import { cn } from '@/shared/lib/cn';

interface PreviewSectionProps {
  previewUrl: string;
  previewLoading: boolean;
}

export const PreviewSection = ({ previewUrl, previewLoading }: PreviewSectionProps) => {
  return (
    <div className={cn('space-y-4')}>
      <h3 className={cn('text-lg font-medium text-gray-800')}>미리보기</h3>
      <div className={cn('relative aspect-square overflow-hidden rounded-lg border bg-gray-100')}>
        {previewLoading ? (
          <div className={cn('absolute inset-0 flex items-center justify-center')}>
            <div
              className={cn(
                'h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin'
              )}
            />
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className={cn('h-full w-full object-contain')}
          />
        ) : (
          <div className={cn('absolute inset-0 flex items-center justify-center text-gray-400')}>
            미리보기 로딩 중...
          </div>
        )}
      </div>
    </div>
  );
};
