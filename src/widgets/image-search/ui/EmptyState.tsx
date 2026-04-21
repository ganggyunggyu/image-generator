import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

interface EmptyStateProps {
  type: 'no-results' | 'initial';
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  if (type === 'no-results') {
    return (
      <div className={cn('py-12 text-center')}>
        <h3 className={cn('mb-2 text-xl font-medium text-gray-800')}>
          조건에 맞는 애견 이미지를 찾지 못했음
        </h3>
        <p className={cn('text-gray-600')}>
          품종명, 장면 키워드, 분양 키워드처럼 더 구체적으로 바꿔서 다시 검색하면 됨
        </p>
      </div>
    );
  }

  return (
    <div className={cn('py-12 text-center')}>
      <h3 className={cn('mb-2 text-xl font-medium text-gray-800')}>
        애견 이미지를 바로 모아보면 됨
      </h3>
      <p className={cn('text-gray-600')}>
        위 프리셋에서 시작하거나 품종명과 장면 키워드를 직접 입력하면 됨
      </p>
      <div className={cn('mt-5 flex justify-center')}>
        <Link
          className={cn(
            'inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition',
            'hover:border-slate-300 hover:text-slate-900'
          )}
          href="/harness"
        >
          하네스 먼저 확인
        </Link>
      </div>
    </div>
  );
};
