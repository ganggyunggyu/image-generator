import { cn } from '@/shared/lib';
import { FRAME_STYLES, FrameStyle } from '@/shared/lib/frame-filter';

interface FrameSelectorProps {
  selectedFrame: FrameStyle;
  onSelectFrame: (frame: FrameStyle) => void;
}

export const FrameSelector = ({ selectedFrame, onSelectFrame }: FrameSelectorProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">액자 스타일</h3>
      <div className="grid grid-cols-3 gap-2">
        {FRAME_STYLES.map((frame) => (
          <button
            key={frame.id}
            onClick={() => onSelectFrame(frame)}
            className={cn(
              'p-3 border rounded-lg text-center transition-all',
              'hover:border-emerald-500 hover:bg-emerald-50',
              selectedFrame.id === frame.id
                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                : 'border-gray-200'
            )}
          >
            <div className="text-2xl mb-1">{frame.preview}</div>
            <div className="text-xs font-medium text-gray-700">{frame.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
