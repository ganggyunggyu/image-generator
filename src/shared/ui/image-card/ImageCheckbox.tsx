import { cn } from '@/shared/lib';

interface ImageCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
}

export const ImageCheckbox = ({ isSelected, onToggle }: ImageCheckboxProps) => {
  return (
    <div className="absolute top-3 left-3 z-20">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className={cn(
          'w-5 h-5 rounded cursor-pointer',
          'accent-emerald-500',
          'transition-all duration-200'
        )}
      />
    </div>
  );
};
