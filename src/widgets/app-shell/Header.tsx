import { cn } from '@/shared/lib/cn';

export const Header = () => {
  return (
    <header className={cn('bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200/50')}>
      <div className={cn('max-w-7xl mx-auto px-6 py-4')}>
        <div className={cn('flex items-center justify-center')}>
          <div className={cn('text-sm font-medium text-gray-500')}>
            Powered by <span className={cn('text-emerald-600 font-semibold')}>WebP</span>
          </div>
        </div>
      </div>
    </header>
  );
};
