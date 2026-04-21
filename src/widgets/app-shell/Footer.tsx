import { cn } from '@/shared/lib/cn';

export const Footer = () => {
  return (
    <footer className={cn('mt-16 border-t border-gray-200/50 bg-white/50 py-8')}>
      <div className={cn('mx-auto max-w-6xl px-6 text-center')}>
        <p className={cn('text-gray-600 text-sm mb-2')}>
          © 2026 Pet Image Processor
        </p>
        <p className={cn('text-gray-400 text-xs')}>
          Google Programmable Search API 기반 수집 도구 · 모든 이미지의 저작권은 원본
          소유자에게 있음
        </p>
      </div>
    </footer>
  );
};
