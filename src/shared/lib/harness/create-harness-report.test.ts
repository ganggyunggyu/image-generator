import { describe, expect, it } from 'vitest';
import { createHarnessReport } from '@/shared/lib/harness';

type InspectablePath = {
  entryCount?: number;
  exists: boolean;
  isDirectory?: boolean;
};

const createInspector = (paths: Record<string, InspectablePath>) => {
  const inspectRelativePath = async (relativePath: string) => {
    const inspection = paths[relativePath];

    if (!inspection) {
      return {
        entryCount: 0,
        exists: false,
        isDirectory: false,
      };
    }

    return {
      entryCount: inspection.entryCount ?? 0,
      exists: inspection.exists,
      isDirectory: inspection.isDirectory ?? inspection.exists,
    };
  };

  return inspectRelativePath;
};

describe('createHarnessReport', () => {
  it('핵심 환경과 샘플 디렉토리가 준비되면 ready 상태를 반환함', async () => {
    const report = await createHarnessReport({
      cwd: '/tmp/temp-image-gen',
      env: {
        GOOGLE_API_KEY: 'key',
        GOOGLE_CSE_ID: 'cse',
        IMAGE_CACHE_SECONDS: '3600',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3939',
      },
      inspectRelativePath: createInspector({
        docs: { exists: true, entryCount: 6 },
        _samples: { exists: true, entryCount: 4 },
        '_samples/examples': { exists: true, entryCount: 4 },
        '_samples/input': { exists: true, entryCount: 1 },
        '_samples/output': { exists: true, entryCount: 1 },
      }),
      now: () => '2026-04-09T00:00:00.000Z',
    });

    expect(report.status).toBe('ready');
    expect(report.generatedAt).toBe('2026-04-09T00:00:00.000Z');
    expect(report.environment.core.GOOGLE_API_KEY).toBe(true);
    expect(report.environment.core.GOOGLE_CSE_ID).toBe(true);
    expect(report.filesystem.docs.entryCount).toBe(6);
    expect(report.apiSurface.some(({ path }) => path === '/api/harness')).toBe(true);
    expect(report.project.agentEntryPoints).toContain('/harness');
    expect(report.workflow.commitPolicy.mode).toBe('verify_then_commit');
    expect(report.workflow.automation.ci.path).toBe('.github/workflows/verify-task.yml');
    expect(report.workflow.automation.hooks.preCommit.path).toBe('.githooks/pre-commit');
    expect(report.workflow.automation.hooks.commitMessage.path).toBe('.githooks/commit-msg');
    expect(report.workflow.automation.hooks.commitTemplate.path).toBe('.gitmessage');
    expect(report.workflow.requiredTaskSteps.map(({ id }) => id)).toEqual([
      'define_expected_result',
      'write_tests_first',
      'implement_minimal_change',
      'verify_target_result',
      'run_full_verification',
      'review_and_commit',
    ]);
    expect(
      report.workflow.requiredTaskSteps.find(({ id }) => id === 'run_full_verification')?.commandHints
    ).toEqual(['pnpm test:run', 'pnpm lint', 'pnpm build:check']);
    expect(report.verification.recommendedCommands).toContain('pnpm build:check');
    expect(report.verification.recommendedCommands).toContain('pnpm verify:task');
    expect(report.verification.recommendedCommands).toContain('pnpm hooks:install');
    expect(report.verification.recommendedCommands).toContain('git status --short');
    expect(report.verification.warnings).toEqual([]);
  });

  it('핵심 환경 또는 문서가 비면 attention 경고를 반환함', async () => {
    const report = await createHarnessReport({
      cwd: '/tmp/temp-image-gen',
      env: {},
      inspectRelativePath: createInspector({
        docs: { exists: false },
        _samples: { exists: false },
        '_samples/examples': { exists: false },
        '_samples/input': { exists: false },
        '_samples/output': { exists: false },
      }),
      now: () => '2026-04-09T00:00:00.000Z',
    });

    expect(report.status).toBe('attention');
    expect(report.environment.core.GOOGLE_API_KEY).toBe(false);
    expect(report.environment.core.GOOGLE_CSE_ID).toBe(false);
    expect(report.workflow.automation.hooks.preCommit.enabled).toBe(true);
    expect(report.workflow.requiredTaskSteps).toHaveLength(6);
    expect(report.verification.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('GOOGLE_API_KEY'),
        expect.stringContaining('GOOGLE_CSE_ID'),
        expect.stringContaining('docs'),
        expect.stringContaining('_samples'),
      ])
    );
  });
});
