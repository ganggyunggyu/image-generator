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
  return (
    <div className="aspect-square relative overflow-hidden bg-gray-50">
      <img
        src={thumbnailUrl}
        alt={title}
        className={cn(
          "w-full h-full object-cover cursor-pointer",
          "transition-transform duration-200",
          "group-hover:scale-105"
        )}
        onClick={onImageClick}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.error-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'error-placeholder w-full h-full flex items-center justify-center bg-gray-100 text-gray-400';
            placeholder.innerHTML = '<div class="text-center"><div class="text-xs font-medium">미리보기 불가능</div></div>';
            parent.appendChild(placeholder);
          }
        }}
      />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onImageClick();
          }}
          className="px-3 py-1.5 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          보기
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSimpleDownload();
          }}
          className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
        >
          다운
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvancedDownload();
          }}
          className="px-3 py-1.5 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          효과
        </button>
      </div>
    </div>
  );
};
