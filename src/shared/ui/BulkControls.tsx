import React from 'react';
import { cn } from '@/shared/lib';
import { FRAME_STYLES, FILTER_STYLES, FrameStyle, FilterStyle, DownloadOptions } from '@/shared/lib/frame-filter';
import { SelectionButtons } from './bulk-controls/SelectionButtons';
import { DownloadActionButtons } from './bulk-controls/DownloadActionButtons';
import { EffectOptionsPanel } from './bulk-controls/EffectOptionsPanel';

interface BulkControlsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDownload: (options?: DownloadOptions) => void;
  bulkDownloadLoading: boolean;
  className?: string;
}

export const BulkControls: React.FC<BulkControlsProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkDownload,
  bulkDownloadLoading,
  className,
}) => {
  const [showEffectOptions, setShowEffectOptions] = React.useState(false);
  const [selectedFrame, setSelectedFrame] = React.useState<FrameStyle>(FRAME_STYLES[0]!);
  const [selectedFilter, setSelectedFilter] = React.useState<FilterStyle>(FILTER_STYLES[0]!);

  const handleBasicDownload = () => {
    onBulkDownload();
  };

  const handleEffectDownload = () => {
    const options: DownloadOptions = {
      frame: selectedFrame,
      filter: selectedFilter,
      quality: 1.0,
    };
    onBulkDownload(options);
  };

  return (
    <>
      <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
        <SelectionButtons
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          disabled={bulkDownloadLoading}
        />

        <DownloadActionButtons
          selectedCount={selectedCount}
          onBasicDownload={handleBasicDownload}
          onShowEffectOptions={() => setShowEffectOptions(!showEffectOptions)}
          bulkDownloadLoading={bulkDownloadLoading}
        />
      </div>

      {showEffectOptions && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEffectOptions(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <EffectOptionsPanel
              selectedFrame={selectedFrame}
              selectedFilter={selectedFilter}
              selectedCount={selectedCount}
              onFrameSelect={setSelectedFrame}
              onFilterSelect={setSelectedFilter}
              onCancel={() => setShowEffectOptions(false)}
              onConfirm={() => {
                handleEffectDownload();
                setShowEffectOptions(false);
              }}
              bulkDownloadLoading={bulkDownloadLoading}
            />
          </div>
        </div>
      )}
    </>
  );
};
