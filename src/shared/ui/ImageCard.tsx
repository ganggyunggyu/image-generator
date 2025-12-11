import React from 'react';
import { cn } from '@/shared/lib';
import { ImageResult } from '@/shared/api/types';
import { DownloadModal } from './DownloadModal';
import { ImageCheckbox } from './image-card/ImageCheckbox';
import { ImageThumbnail } from './image-card/ImageThumbnail';
import { ImageInfo } from './image-card/ImageInfo';

interface ImageCardProps {
  image: ImageResult;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  onImageClick: (imageUrl: string, title: string) => void;
  onDownload: (imageUrl: string, title: string) => void;
  onLoadError?: (index: number) => void;
  className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  isSelected,
  onToggleSelect,
  onImageClick,
  onDownload,
  onLoadError,
  className,
}) => {
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  const handleSimpleDownload = () => {
    onDownload(image.imageUrl, image.title);
  };

  const handleAdvancedDownload = () => {
    setShowDownloadModal(true);
  };

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-xl overflow-hidden card-hover shadow-clean',
          'relative group border border-gray-100',
          isSelected && 'ring-2 ring-emerald-500 shadow-clean-lg',
          className
        )}
      >
        <ImageCheckbox
          isSelected={isSelected}
          onToggle={() => onToggleSelect(index)}
        />

        <ImageThumbnail
          thumbnailUrl={image.imageUrl}
          title={image.title}
          onImageClick={() => onImageClick(image.imageUrl, image.title)}
          onSimpleDownload={handleSimpleDownload}
          onAdvancedDownload={handleAdvancedDownload}
          onLoadError={() => onLoadError?.(index)}
        />

        <ImageInfo
          title={image.title}
          width={image.image.width}
          height={image.image.height}
          contextLink={image.image.contextLink}
        />
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        imageUrl={image.imageUrl}
        imageName={image.title}
      />
    </>
  );
};
