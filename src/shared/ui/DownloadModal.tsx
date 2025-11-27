import { useDownloadModal } from './download-modal/hooks/use-download-modal';
import {
  ModalOverlay,
  ModalHeader,
  PreviewSection,
  FrameSelector,
  FilterSelector,
  DownloadButtons,
} from './download-modal/ui';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}) => {
  const {
    selectedFrame,
    setSelectedFrame,
    selectedFilter,
    setSelectedFilter,
    previewUrl,
    isProcessing,
    previewLoading,
    handleDownload,
  } = useDownloadModal(imageUrl, imageName, isOpen);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader onClose={onClose} />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PreviewSection previewUrl={previewUrl} previewLoading={previewLoading} />

        <div className="space-y-6">
          <FrameSelector selectedFrame={selectedFrame} onSelectFrame={setSelectedFrame} />
          <FilterSelector selectedFilter={selectedFilter} onSelectFilter={setSelectedFilter} />
        </div>
      </div>

      <DownloadButtons
        onDownloadOriginal={() => handleDownload(false)}
        onDownloadWithEffects={() => handleDownload(true)}
        isProcessing={isProcessing}
        previewLoading={previewLoading}
      />
    </ModalOverlay>
  );
};
