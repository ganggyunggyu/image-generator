import type { MouseEvent } from 'react';
import { cn } from '@/shared/lib';
import {
  PET_PROCESSOR_PRESETS,
  getPetProcessorFeaturedQueries,
} from '../lib/presets';

interface PetProcessorPanelProps {
  currentQuery: string;
  onQuerySelect: (query: string) => void;
}

const PROCESS_STEPS = [
  '품종 또는 장면 키워드를 고름',
  '원본 후보를 빠르게 확인함',
  '선택본을 내려받고 효과를 적용함',
];

export const PetProcessorPanel = ({
  currentQuery,
  onQuerySelect,
}: PetProcessorPanelProps) => {
  const featuredQueries = getPetProcessorFeaturedQueries();

  const handlePresetClick = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const { query } = event.currentTarget.dataset;

    if (!query) {
      return;
    }

    onQuerySelect(query);
  };

  const handleFeaturedQueryClick = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const { query } = event.currentTarget.dataset;

    if (!query) {
      return;
    }

    onQuerySelect(query);
  };

  return (
    <section
      className={cn(
        'mx-auto mb-8 max-w-6xl rounded-lg border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white px-5 py-6',
        'sm:px-6'
      )}
    >
      <div className={cn('grid gap-6 lg:grid-cols-[1.15fr_0.85fr]')}>
        <div className={cn('space-y-5')}>
          <div className={cn('space-y-2')}>
            <p className={cn('text-sm font-semibold text-emerald-700')}>
              애견 이미지 프로세서
            </p>
            <h2 className={cn('text-3xl font-black text-gray-900')}>
              품종 컷부터 분양형 키워드까지 바로 시작 가능함
            </h2>
            <p className={cn('max-w-3xl text-sm leading-6 text-slate-600')}>
              추천 프리셋으로 검색어를 채우고, 필요한 이미지를 고른 뒤 개별 다운로드나
              일괄 효과 적용으로 바로 마감하면 됨
            </p>
          </div>

          <div className={cn('grid gap-3 md:grid-cols-3')}>
            {PET_PROCESSOR_PRESETS.map((preset) => {
              const isActive =
                currentQuery.trim() === preset.query ||
                preset.quickKeywords.includes(currentQuery.trim());

              return (
                <button
                  key={preset.id}
                  type="button"
                  data-query={preset.query}
                  onClick={handlePresetClick}
                  className={cn(
                    'rounded-lg border px-4 py-4 text-left transition-colors',
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-white bg-white text-slate-900 hover:border-emerald-200 hover:bg-emerald-50'
                  )}
                >
                  <div className={cn('mb-2 flex items-center justify-between gap-3')}>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        isActive ? 'text-emerald-50' : 'text-emerald-700'
                      )}
                    >
                      {preset.label}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-1 text-xs font-medium',
                        isActive ? 'bg-emerald-400/30 text-white' : 'bg-emerald-100 text-emerald-700'
                      )}
                    >
                      {preset.query}
                    </span>
                  </div>
                  <p className={cn('mb-2 text-sm font-semibold leading-6')}>
                    {preset.title}
                  </p>
                  <p
                    className={cn(
                      'text-xs leading-5',
                      isActive ? 'text-emerald-50' : 'text-slate-600'
                    )}
                  >
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className={cn('space-y-3')}>
            <p className={cn('text-sm font-semibold text-slate-700')}>
              자주 쓰는 키워드
            </p>
            <div className={cn('flex flex-wrap gap-2')}>
              {featuredQueries.map((keyword) => {
                const isSelected = currentQuery.trim() === keyword;

                return (
                  <button
                    key={keyword}
                    type="button"
                    data-query={keyword}
                    onClick={handleFeaturedQueryClick}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700'
                    )}
                  >
                    {keyword}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cn('grid gap-3 self-start')}>
          {PROCESS_STEPS.map((step, index) => (
            <div
              key={step}
              className={cn('rounded-lg border border-white bg-white px-4 py-4')}
            >
              <p className={cn('mb-1 text-xs font-semibold text-emerald-700')}>
                STEP {index + 1}
              </p>
              <p className={cn('text-sm font-medium leading-6 text-slate-800')}>
                {step}
              </p>
            </div>
          ))}

          <div className={cn('rounded-lg border border-dashed border-emerald-200 px-4 py-4')}>
            <p className={cn('mb-1 text-xs font-semibold text-emerald-700')}>
              처리 팁
            </p>
            <p className={cn('text-sm leading-6 text-slate-700')}>
              검색 후 카드 우측 액션으로 원본 저장도 가능하고, 여러 장을 고른 뒤 일괄
              효과 적용 다운로드로 결과물을 한 번에 묶을 수 있음
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
