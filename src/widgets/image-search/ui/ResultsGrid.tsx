import { cn } from '@/shared/lib';
import { ImageCard } from '@/shared/ui';
import { ImageResult } from '@/shared/api/types';

interface ResultsGridProps {
  results: ImageResult[];
  selectedImages: Set<number>;
  onToggleSelect: (index: number) => void;
  onImageClick: (imageUrl: string, title: string) => void;
  onDownload: (imageUrl: string, title: string) => void;
  onLoadError?: (index: number) => void;
}

export const ResultsGrid = ({
  results,
  selectedImages,
  onToggleSelect,
  onImageClick,
  onDownload,
  onLoadError,
}: ResultsGridProps) => {
  return (
    <div className={cn(
      'grid gap-6',
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    )}>
      {results.map((result, index) => (
        <ImageCard
          key={result.link}
          image={result}
          index={index}
          isSelected={selectedImages.has(index)}
          onToggleSelect={onToggleSelect}
          onImageClick={onImageClick}
          onDownload={onDownload}
          {...(onLoadError && { onLoadError })}
        />
      ))}
    </div>
  );
};
