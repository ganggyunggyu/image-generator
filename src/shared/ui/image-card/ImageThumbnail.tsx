/* eslint-disable @next/next/no-img-element -- 검색 썸네일은 프록시/원격 URL 이 혼합됨 */
import type { MouseEvent } from 'react';
import { cn } from '@/shared/lib';

interface ImageThumbnailProps {
  thumbnailUrl: string;
  title: string;
  onImageClick: () => void;
  onSimpleDownload: () => void;
  onAdvancedDownload: () => void;
}

export const ImageThumbnail = ({
  thumbnailUrl,
  title,
  onImageClick,
  onSimpleDownload,
  onAdvancedDownload,
}: ImageThumbnailProps) => {
  const handlePreviewButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onImageClick();
  };

  const handleSimpleDownloadButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSimpleDownload();
  };

  const handleAdvancedDownloadButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAdvancedDownload();
  };

  return (
    <div className={cn('relative aspect-square overflow-hidden bg-gray-50')}>
      <img
        src={thumbnailUrl}
        alt={title}
        className={cn(
          'h-full w-full cursor-pointer object-cover',
          'transition-transform duration-200',
          'group-hover:scale-105'
        )}
        onClick={onImageClick}
      />

      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-200',
          'group-hover:pointer-events-auto group-hover:opacity-100'
        )}
      >
        <button
          onClick={handlePreviewButtonClick}
          className={cn(
            'rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-100'
          )}
        >
          보기
        </button>
        <button
          onClick={handleSimpleDownloadButtonClick}
          className={cn(
            'rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600'
          )}
        >
          다운
        </button>
        <button
          onClick={handleAdvancedDownloadButtonClick}
          className={cn(
            'rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800'
          )}
        >
          효과
        </button>
      </div>
    </div>
  );
};
