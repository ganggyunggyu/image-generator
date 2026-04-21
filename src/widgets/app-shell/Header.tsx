import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

export const Header = () => {
  return (
    <header className={cn('bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200/50')}>
      <div
        className={cn(
          'mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'
        )}
      >
        <Link className={cn('flex flex-col gap-1')} href="/">
          <span className={cn('text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600')}>
            Pet Workflow
          </span>
          <span className={cn('text-lg font-black text-slate-900')}>애견 이미지 프로세서</span>
        </Link>

        <nav className={cn('flex items-center gap-2 sm:justify-end')}>
          <Link
            className={cn(
              'rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition',
              'hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            )}
            href="/"
          >
            프로세서
          </Link>
          <Link
            className={cn(
              'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition',
              'hover:border-emerald-300 hover:bg-emerald-100'
            )}
            href="/harness"
          >
            하네스
          </Link>
        </nav>
      </div>
    </header>
  );
};
