import { cn } from '@/shared/lib/cn';

export const Footer = () => {
  return (
    <footer className={cn('bg-white/50 border-t border-gray-200/50 mt-16 py-8')}>
      <div className={cn('max-w-6xl mx-auto px-6 text-center')}>
        <p className={cn('text-gray-600 text-sm mb-2')}>
          © 2024 Image Gallery Service
        </p>
        <p className={cn('text-gray-400 text-xs')}>
          Google Programmable Search API · 모든 이미지의 저작권은 원본 소유자에게 있습니다
        </p>
      </div>
    </footer>
  );
};
