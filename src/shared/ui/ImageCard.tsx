import React from 'react';
import { cn } from '@/shared/lib';
import { ImageResult } from '@/shared/api/types';
import { DownloadModal } from './DownloadModal';

interface ImageCardProps {
  image: ImageResult;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  onImageClick: (pngUrl: string, title: string) => void;
  onDownload: (pngUrl: string, title: string) => void;
  className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  isSelected,
  onToggleSelect,
  onImageClick,
  onDownload,
  className,
}) => {
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  const handleSimpleDownload = () => {
    onDownload(image.pngUrl, image.title);
  };

  const handleAdvancedDownload = () => {
    setShowDownloadModal(true);
  };

  return (
    <React.Fragment>
      <div
        className={cn(
          'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow',
          'relative',
          isSelected && 'ring-2 ring-purple-500',
          className
        )}
      >
        {/* 선택 체크박스 */}
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(index)}
            className={cn(
              'w-5 h-5 text-purple-600 bg-white border-gray-300 rounded',
              'focus:ring-purple-500 focus:ring-2'
            )}
          />
        </div>

        <div className="aspect-square relative group bg-gray-100">
          <img
            src={image.image.thumbnailLink}
            alt={image.title}
            className={cn(
              "w-full h-full object-cover cursor-pointer",
              "bg-gray-100 border border-gray-200"
            )}
            onClick={() => onImageClick(image.pngUrl, image.title)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.error-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.className = 'error-placeholder w-full h-full flex items-center justify-center bg-gray-100 text-gray-400';
                placeholder.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">📸</div><div class="text-xs">이미지 미리보기<br/>불가능</div></div>';
                parent.appendChild(placeholder);
              }
            }}
            onLoad={(e) => {
              console.log('썸네일 로드 성공:', image.title);
            }}
          />
          {/* 호버 시에만 나타나는 버튼들 */}
          <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-50 transition-all flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(image.pngUrl, image.title);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 shadow-lg"
              >
                보기
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimpleDownload();
                }}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 shadow-lg"
              >
                PNG
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdvancedDownload();
                }}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 shadow-lg"
              >
                🎨효과
              </button>
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 truncate" title={image.title}>
            {image.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {image.image.width} × {image.image.height}
          </p>
          <a
            href={image.image.contextLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-1 block truncate"
          >
            원본 페이지
          </a>
        </div>
      </div>

      {/* 다운로드 모달 */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        imageUrl={image.pngUrl}
        imageName={image.title}
      />
    </React.Fragment>
  );
};