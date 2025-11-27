import { useState } from 'react';

export const useImageSelection = (resultsLength: number) => {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  const toggleImageSelection = (index: number): string | null => {
    const newSelected = new Set(selectedImages);

    if (newSelected.has(index)) {
      newSelected.delete(index);
      setSelectedImages(newSelected);
      return null;
    }

    if (newSelected.size >= 30) {
      return '최대 30개까지만 선택할 수 있습니다';
    }

    newSelected.add(index);
    setSelectedImages(newSelected);
    return null;
  };

  const selectAllImages = (): string | null => {
    if (resultsLength > 30) {
      setSelectedImages(new Set(Array.from({ length: 30 }, (_, i) => i)));
      return '최대 30개까지만 선택됩니다';
    }

    setSelectedImages(new Set(Array.from({ length: resultsLength }, (_, i) => i)));
    return null;
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  return {
    selectedImages,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    setSelectedImages,
  };
};
