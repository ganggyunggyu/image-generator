import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/cn';
import type { HarnessReport } from '@/shared/lib/harness';

interface HarnessDashboardProps {
  report: HarnessReport;
}

interface StatusItem {
  hint: string;
  label: string;
  value: boolean;
}

const SECTION_CARD_CLASS_NAME = cn(
  'rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-clean backdrop-blur-sm'
);

const STATUS_LABEL_BY_VALUE = {
  attention: 'Attention',
  ready: 'Ready',
} as const;

const formatGeneratedAt = (generatedAt: string) => {
  const date = new Date(generatedAt);

  if (Number.isNaN(date.getTime())) {
    return generatedAt;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(date);
};

const createStatusToneClassName = (value: boolean) => {
  return value
    ? cn('border-emerald-200 bg-emerald-50 text-emerald-700')
    : cn('border-amber-200 bg-amber-50 text-amber-700');
};

const createSummaryToneClassName = (status: HarnessReport['status']) => {
  return status === 'ready'
    ? cn('border-emerald-200 bg-emerald-50 text-emerald-700')
    : cn('border-amber-200 bg-amber-50 text-amber-700');
};

const createEnvironmentItems = (report: HarnessReport) => {
  const coreItems: StatusItem[] = [
    {
      hint: 'Google 이미지 검색 API 인증 키',
      label: 'GOOGLE_API_KEY',
      value: report.environment.core.GOOGLE_API_KEY,
    },
    {
      hint: 'Programmable Search Engine 식별자',
      label: 'GOOGLE_CSE_ID',
      value: report.environment.core.GOOGLE_CSE_ID,
    },
  ];

  const optionalItems: StatusItem[] = [
    {
      hint: '이미지 캐시 TTL 오버라이드',
      label: 'IMAGE_CACHE_SECONDS',
      value: report.environment.optional.IMAGE_CACHE_SECONDS,
    },
    {
      hint: '배포 주소 기반 링크 계산',
      label: 'NEXT_PUBLIC_SITE_URL',
      value: report.environment.optional.NEXT_PUBLIC_SITE_URL,
    },
  ];

  const integrationItems: StatusItem[] = [
    {
      hint: '원본/출력 이미지 버킷 연동',
      label: 'AWS S3',
      value: report.environment.integrations.awsS3Configured,
    },
    {
      hint: '카테고리 메타데이터 시트 연동',
      label: 'Google Sheets',
      value: report.environment.integrations.googleSheetsConfigured,
    },
    {
      hint: 'Grok 이미지 생성 보조 연동',
      label: 'Grok',
      value: report.environment.integrations.grokConfigured,
    },
    {
      hint: '번역 전처리 연동',
      label: 'Google Translate',
      value: report.environment.integrations.translateConfigured,
    },
  ];

  return {
    coreItems,
    integrationItems,
    optionalItems,
  };
};

const countReadyItems = (items: StatusItem[]) => {
  return items.filter(({ value }) => value).length;
};

const StatusBadge = ({
  children,
  value,
}: {
  children: ReactNode;
  value: boolean;
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
        createStatusToneClassName(value)
      )}
    >
      {children}
    </span>
  );
};

const SummaryCard = ({
  eyebrow,
  title,
  value,
}: {
  eyebrow: string;
  title: string;
  value: string;
}) => {
  return (
    <article
      className={cn(
        'rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-clean backdrop-blur-sm'
      )}
    >
      <p className={cn('text-xs font-semibold uppercase tracking-[0.28em] text-slate-500')}>
        {eyebrow}
      </p>
      <p className={cn('mt-3 text-2xl font-black text-slate-900')}>{value}</p>
      <p className={cn('mt-2 text-sm text-slate-600')}>{title}</p>
    </article>
  );
};

const StatusList = ({ items }: { items: StatusItem[] }) => {
  return (
    <div className={cn('space-y-3')}>
      {items.map(({ hint, label, value }) => (
        <article
          key={label}
          className={cn(
            'flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-4 py-4',
            'sm:flex-row sm:items-center sm:justify-between'
          )}
        >
          <div>
            <p className={cn('text-sm font-semibold text-slate-900')}>{label}</p>
            <p className={cn('mt-1 text-sm text-slate-500')}>{hint}</p>
          </div>
          <StatusBadge value={value}>{value ? 'Configured' : 'Missing'}</StatusBadge>
        </article>
      ))}
    </div>
  );
};

const WorkflowList = ({
  steps,
}: {
  steps: HarnessReport['workflow']['requiredTaskSteps'];
}) => {
  return (
    <div className={cn('space-y-3')}>
      {steps.map(({ commandHints, description, id, title }, index) => (
        <article
          key={id}
          className={cn('rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-4 py-4')}
        >
          <div className={cn('flex items-start gap-4')}>
            <span
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50',
                'text-sm font-black text-emerald-700'
              )}
            >
              {index + 1}
            </span>
            <div className={cn('min-w-0 flex-1')}>
              <p className={cn('text-sm font-semibold text-slate-900')}>{title}</p>
              <p className={cn('mt-1 text-sm leading-6 text-slate-500')}>{description}</p>
              {commandHints.length > 0 && (
                <div className={cn('mt-3 flex flex-wrap gap-2')}>
                  {commandHints.map((commandHint) => (
                    <code
                      key={`${id}-${commandHint}`}
                      className={cn(
                        'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600'
                      )}
                    >
                      {commandHint}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

const AutomationList = ({
  automation,
}: {
  automation: HarnessReport['workflow']['automation'];
}) => {
  const items = [
    {
      description: '커밋 직전에 verify:task 를 자동 실행함',
      enabled: automation.hooks.preCommit.enabled,
      label: 'pre-commit',
      path: automation.hooks.preCommit.path,
    },
    {
      description: '커밋 메시지에 Expected, Verification, Tests 줄을 요구함',
      enabled: automation.hooks.commitMessage.enabled,
      label: 'commit-msg',
      path: automation.hooks.commitMessage.path,
    },
    {
      description: '커밋 편집기 기본 템플릿을 제공함',
      enabled: automation.hooks.commitTemplate.enabled,
      label: 'commit template',
      path: automation.hooks.commitTemplate.path,
    },
    {
      description: '원격에서도 verify:task 를 다시 실행함',
      enabled: automation.ci.enabled,
      label: 'GitHub Actions',
      path: automation.ci.path,
    },
  ];

  return (
    <div className={cn('space-y-3')}>
      {items.map(({ description, enabled, label, path }) => (
        <article
          key={label}
          className={cn(
            'flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-4 py-4',
            'sm:flex-row sm:items-center sm:justify-between'
          )}
        >
          <div>
            <p className={cn('text-sm font-semibold text-slate-900')}>{label}</p>
            <p className={cn('mt-1 text-sm text-slate-500')}>{description}</p>
            <p className={cn('mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400')}>
              {path}
            </p>
          </div>
          <StatusBadge value={enabled}>{enabled ? 'Enabled' : 'Disabled'}</StatusBadge>
        </article>
      ))}
    </div>
  );
};

const HarnessDashboard = ({ report }: HarnessDashboardProps) => {
  const { coreItems, integrationItems, optionalItems } = createEnvironmentItems(report);
  const warningCount = report.verification.warnings.length;
  const samplesEntryCount =
    report.filesystem.samples.examples.entryCount +
    report.filesystem.samples.input.entryCount +
    report.filesystem.samples.output.entryCount;

  return (
    <section className={cn('mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-12')}>
      <div
        className={cn(
          'overflow-hidden rounded-[36px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
          'p-8 shadow-clean-lg'
        )}
      >
        <div className={cn('flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between')}>
          <div className={cn('max-w-3xl')}>
            <div className={cn('flex flex-wrap items-center gap-3')}>
              <span className={cn('text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700')}>
                Harness Dashboard
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
                  createSummaryToneClassName(report.status)
                )}
              >
                {STATUS_LABEL_BY_VALUE[report.status]}
              </span>
            </div>
            <h1 className={cn('mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl')}>
              레포 상태와 운영 준비도를 한 화면에서 확인함
            </h1>
            <p className={cn('mt-4 max-w-2xl text-base leading-7 text-slate-600')}>
              환경변수, 샘플 자산, 핵심 API surface, 검증 루프를 사람 관점으로 재정리한 하네스 페이지임.
              에이전트는 JSON을 읽고, 사람은 이 화면으로 현재 준비도를 빠르게 판단하면 됨.
            </p>
          </div>

          <div className={cn('flex flex-col gap-3 sm:flex-row')}>
            <Link
              className={cn(
                'inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700',
                'transition hover:border-slate-400 hover:text-slate-900'
              )}
              href="/"
            >
              검색 화면으로 이동
            </Link>
            <Link
              className={cn(
                'inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white',
                'transition hover:bg-emerald-500'
              )}
              href="/api/harness"
            >
              JSON surface 보기
            </Link>
          </div>
        </div>

        <div className={cn('mt-8 grid gap-4 md:grid-cols-3')}>
          <SummaryCard
            eyebrow="Current Status"
            title="현재 하네스 상태"
            value={STATUS_LABEL_BY_VALUE[report.status]}
          />
          <SummaryCard
            eyebrow="Generated At"
            title="마지막 생성 시각"
            value={formatGeneratedAt(report.generatedAt)}
          />
          <SummaryCard
            eyebrow="Workspace"
            title="프로젝트 루트"
            value={report.project.name}
          />
        </div>
      </div>

      <div className={cn('grid gap-6 xl:grid-cols-[1.3fr_0.7fr]')}>
        <section className={SECTION_CARD_CLASS_NAME}>
          <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between')}>
            <div>
              <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
                Environment
              </p>
              <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>
                실행 준비 상태
              </h2>
            </div>
            <p className={cn('text-sm text-slate-500')}>
              핵심 {countReadyItems(coreItems)}/{coreItems.length} · 선택 {countReadyItems(optionalItems)}/{optionalItems.length}
            </p>
          </div>

          <div className={cn('mt-6 grid gap-6 xl:grid-cols-3')}>
            <div className={cn('space-y-4')}>
              <h3 className={cn('text-lg font-bold text-slate-900')}>핵심 환경</h3>
              <StatusList items={coreItems} />
            </div>
            <div className={cn('space-y-4')}>
              <h3 className={cn('text-lg font-bold text-slate-900')}>선택 환경</h3>
              <StatusList items={optionalItems} />
            </div>
            <div className={cn('space-y-4')}>
              <h3 className={cn('text-lg font-bold text-slate-900')}>통합 연동</h3>
              <StatusList items={integrationItems} />
            </div>
          </div>
        </section>

        <section className={cn('space-y-6')}>
          <article className={SECTION_CARD_CLASS_NAME}>
            <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
              Filesystem
            </p>
            <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>로컬 하네스 자산</h2>

            <div className={cn('mt-6 space-y-4')}>
              <article className={cn('rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4')}>
                <div className={cn('flex items-center justify-between gap-3')}>
                  <div>
                    <p className={cn('text-sm font-semibold text-slate-900')}>문서 지식 베이스</p>
                    <p className={cn('mt-1 text-sm text-slate-500')}>{report.filesystem.docs.path}</p>
                  </div>
                  <StatusBadge value={report.filesystem.docs.exists}>
                    {report.filesystem.docs.exists ? 'Present' : 'Missing'}
                  </StatusBadge>
                </div>
                <p className={cn('mt-3 text-sm text-slate-600')}>
                  문서 엔트리 {report.filesystem.docs.entryCount}개 탐지됨
                </p>
              </article>

              <article className={cn('rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4')}>
                <div className={cn('flex items-center justify-between gap-3')}>
                  <div>
                    <p className={cn('text-sm font-semibold text-slate-900')}>샘플 워크스페이스</p>
                    <p className={cn('mt-1 text-sm text-slate-500')}>{report.filesystem.samples.root.path}</p>
                  </div>
                  <StatusBadge value={report.filesystem.samples.root.exists}>
                    {report.filesystem.samples.root.exists ? 'Present' : 'Missing'}
                  </StatusBadge>
                </div>
                <p className={cn('mt-3 text-sm text-slate-600')}>
                  examples/input/output 합산 엔트리 {samplesEntryCount}개 확인됨
                </p>
              </article>
            </div>
          </article>

          <article className={SECTION_CARD_CLASS_NAME}>
            <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
              Project
            </p>
            <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>에이전트 진입 지점</h2>

            <div className={cn('mt-6 space-y-3')}>
              <article className={cn('rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4')}>
                <p className={cn('text-sm text-slate-500')}>rootDirectory</p>
                <p className={cn('mt-2 break-all text-sm font-semibold text-slate-900')}>
                  {report.project.rootDirectory}
                </p>
              </article>

              {report.project.agentEntryPoints.map((entryPoint) => (
                <article
                  key={entryPoint}
                  className={cn('rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4')}
                >
                  <p className={cn('text-sm font-semibold text-slate-900')}>{entryPoint}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>

      <div className={cn('grid gap-6 lg:grid-cols-[1.1fr_0.9fr]')}>
        <section className={SECTION_CARD_CLASS_NAME}>
          <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
            API Surface
          </p>
          <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>핵심 엔드포인트</h2>

          <div className={cn('mt-6 space-y-3')}>
            {report.apiSurface.map(({ path, purpose }) => (
              <article
                key={path}
                className={cn(
                  'flex flex-col gap-2 rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-4 py-4',
                  'sm:flex-row sm:items-center sm:justify-between'
                )}
              >
                <div>
                  <p className={cn('text-sm font-semibold text-slate-900')}>{path}</p>
                  <p className={cn('mt-1 text-sm text-slate-500')}>{purpose}</p>
                </div>
                <span className={cn('text-xs font-semibold uppercase tracking-[0.24em] text-slate-400')}>
                  Active Surface
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className={cn('space-y-6')}>
          <article className={SECTION_CARD_CLASS_NAME}>
            <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
              Workflow
            </p>
            <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>매 작업 체크리스트</h2>
            <p className={cn('mt-3 text-sm leading-6 text-slate-600')}>
              {report.workflow.commitPolicy.summary}
            </p>

            <div className={cn('mt-6')}>
              <WorkflowList steps={report.workflow.requiredTaskSteps} />
            </div>
          </article>

          <article className={SECTION_CARD_CLASS_NAME}>
            <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
              Automation
            </p>
            <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>강제 지점</h2>

            <div className={cn('mt-6')}>
              <AutomationList automation={report.workflow.automation} />
            </div>
          </article>

          <article className={SECTION_CARD_CLASS_NAME}>
            <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
              Verification
            </p>
            <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>짧은 검증 루프</h2>

            <div className={cn('mt-6 flex flex-wrap gap-3')}>
              {report.verification.recommendedCommands.map((command) => (
                <code
                  key={command}
                  className={cn(
                    'rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700'
                  )}
                >
                  {command}
                </code>
              ))}
            </div>
          </article>

          <article className={SECTION_CARD_CLASS_NAME}>
            <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between')}>
              <div>
                <p className={cn('text-sm font-semibold uppercase tracking-[0.24em] text-slate-500')}>
                  Warnings
                </p>
                <h2 className={cn('mt-2 text-2xl font-black text-slate-900')}>현재 주의 포인트</h2>
              </div>
              <span
                className={cn(
                  'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
                  warningCount === 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                )}
              >
                {warningCount === 0 ? 'No Warnings' : `${warningCount} Warnings`}
              </span>
            </div>

            {warningCount === 0 ? (
              <article className={cn('mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4')}>
                <p className={cn('text-sm font-semibold text-emerald-700')}>
                  현재 하네스 기준으로 즉시 조치가 필요한 경고는 없음
                </p>
              </article>
            ) : (
              <div className={cn('mt-6 space-y-3')}>
                {report.verification.warnings.map((warning) => (
                  <article
                    key={warning}
                    className={cn('rounded-[22px] border border-amber-200 bg-amber-50/80 p-4')}
                  >
                    <p className={cn('text-sm font-medium leading-6 text-amber-900')}>{warning}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </section>
  );
};

export { HarnessDashboard };
