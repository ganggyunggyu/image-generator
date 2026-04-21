import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

export const SearchHeader = () => {
  return (
    <div className={cn('mb-10 text-center')}>
      <div className={cn('mb-5 flex justify-center')}>
        <Link
          className={cn(
            'inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700',
            'transition hover:border-emerald-300 hover:bg-emerald-100'
          )}
          href="/harness"
        >
          하네스 상태 점검
        </Link>
      </div>
      <p className={cn('mb-3 text-sm font-semibold text-emerald-700')}>
        애견 전용 검색 · 선별 · 다운로드 워크플로우
      </p>
      <h1 className={cn('text-5xl font-black text-gray-900')}>
        애견 이미지 프로세서
      </h1>
      <p className={cn('mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600')}>
        품종 소개용 컷, 산책 장면, 분양형 키워드를 빠르게 모으고 원하는 결과물만 골라
        내려받는 작업 화면임
      </p>
    </div>
  );
};
