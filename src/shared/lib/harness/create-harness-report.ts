import { readdir, stat } from 'fs/promises';
import path from 'path';

const CORE_ENV_KEYS = ['GOOGLE_API_KEY', 'GOOGLE_CSE_ID'] as const;
const OPTIONAL_ENV_KEYS = ['IMAGE_CACHE_SECONDS', 'NEXT_PUBLIC_SITE_URL'] as const;

const API_SURFACE = [
  { path: '/api/image/search', purpose: 'Google 이미지 검색' },
  { path: '/api/image/proxy', purpose: '원본 이미지를 WebP로 변환' },
  { path: '/api/image/random-frames', purpose: '랜덤 키워드 기반 프레임 이미지 생성' },
  { path: '/api/image/category-random', purpose: '카테고리 랜덤 이미지 공급' },
  { path: '/api/image/keyword-frames', purpose: '키워드 기반 프레임 이미지 생성' },
  { path: '/api/image/product-images', purpose: '상품용 이미지 세트 조회' },
  { path: '/api/image/product-metadata', purpose: '상품 메타데이터 조회' },
  { path: '/api/image/ai-images', purpose: 'AI 이미지 후보 세트 조회' },
  { path: '/api/image/bulk-download', purpose: '원본 이미지 ZIP 다운로드' },
  { path: '/api/image/bulk-download-processed', purpose: '효과 적용 이미지 ZIP 다운로드' },
  { path: '/api/harness', purpose: '프로젝트 하네스 진단 JSON' },
] as const;

const REQUIRED_TASK_STEPS = [
  {
    commandHints: [],
    description: '수정 전에 원하는 결과와 실패 조건을 먼저 정리함',
    id: 'define_expected_result',
    title: '원하는 결과 먼저 정의',
  },
  {
    commandHints: ['pnpm test:run'],
    description: '구현 전에 테스트 코드를 추가하거나 기존 계약 테스트를 먼저 수정함',
    id: 'write_tests_first',
    title: '테스트 코드를 먼저 만듦',
  },
  {
    commandHints: [],
    description: '테스트가 요구하는 최소 변경만 구현하고 영향 범위를 좁힘',
    id: 'implement_minimal_change',
    title: '최소 수정으로 구현',
  },
  {
    commandHints: ['pnpm test:run'],
    description: '관련 테스트나 재현 절차로 원하는 결과가 실제로 나오는지 확인함',
    id: 'verify_target_result',
    title: '원하는 결과를 직접 확인',
  },
  {
    commandHints: ['pnpm test:run', 'pnpm lint', 'pnpm build:check'],
    description: '작업 마무리 전에 테스트 전체, 엄격한 린트, build warning 검사를 다시 돌려 회귀를 막음',
    id: 'run_full_verification',
    title: '전체 테스트와 린트 검증',
  },
  {
    commandHints: ['git status --short'],
    description: 'diff 를 검토해 의미 단위 커밋이 가능한 상태인지 확인하고 요청이 있으면 바로 커밋함',
    id: 'review_and_commit',
    title: '커밋 준비 또는 커밋까지 확인',
  },
] as const;

type CoreEnvKey = (typeof CORE_ENV_KEYS)[number];
type OptionalEnvKey = (typeof OPTIONAL_ENV_KEYS)[number];
type RequiredTaskStep = (typeof REQUIRED_TASK_STEPS)[number];

type HarnessStatus = 'ready' | 'attention';

type PathInspection = {
  entryCount: number;
  exists: boolean;
  isDirectory: boolean;
};

type RelativePathInspector = (relativePath: string) => Promise<PathInspection>;

type HarnessRuntime = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  inspectRelativePath: RelativePathInspector;
  now: () => string;
};

export type HarnessReport = {
  apiSurface: Array<{
    path: string;
    purpose: string;
  }>;
  environment: {
    core: Record<CoreEnvKey, boolean>;
    integrations: {
      awsS3Configured: boolean;
      googleSheetsConfigured: boolean;
      grokConfigured: boolean;
      translateConfigured: boolean;
    };
    optional: Record<OptionalEnvKey, boolean>;
  };
  filesystem: {
    docs: {
      entryCount: number;
      exists: boolean;
      path: string;
    };
    samples: {
      examples: {
        entryCount: number;
        exists: boolean;
        path: string;
      };
      input: {
        entryCount: number;
        exists: boolean;
        path: string;
      };
      output: {
        entryCount: number;
        exists: boolean;
        path: string;
      };
      root: {
        entryCount: number;
        exists: boolean;
        path: string;
      };
    };
  };
  generatedAt: string;
  project: {
    agentEntryPoints: string[];
    name: string;
    rootDirectory: string;
  };
  status: HarnessStatus;
  workflow: {
    automation: {
      ci: {
        enabled: boolean;
        path: string;
      };
      hooks: {
        commitMessage: {
          enabled: boolean;
          path: string;
        };
        commitTemplate: {
          enabled: boolean;
          path: string;
        };
        preCommit: {
          enabled: boolean;
          path: string;
        };
      };
    };
    commitPolicy: {
      mode: 'verify_then_commit';
      summary: string;
    };
    requiredTaskSteps: Array<{
      commandHints: string[];
      description: string;
      id: RequiredTaskStep['id'];
      title: string;
    }>;
  };
  verification: {
    recommendedCommands: string[];
    warnings: string[];
  };
};

const hasValue = (value: string | undefined): boolean => Boolean(value?.trim());

const createEnvironmentStatus = <T extends readonly string[]>(
  keys: T,
  env: NodeJS.ProcessEnv
): Record<T[number], boolean> => {
  const status = {} as Record<T[number], boolean>;

  keys.forEach((key: T[number]) => {
    status[key] = hasValue(env[key]);
  });

  return status;
};

const createPathSummary = (
  relativePath: string,
  inspection: PathInspection
): {
  entryCount: number;
  exists: boolean;
  path: string;
} => ({
  entryCount: inspection.entryCount,
  exists: inspection.exists,
  path: relativePath,
});

const createDefaultInspector = (cwd: string): RelativePathInspector => {
  const inspectRelativePath = async (relativePath: string): Promise<PathInspection> => {
    const absolutePath = path.join(cwd, relativePath);

    try {
      const stats = await stat(absolutePath);

      if (!stats.isDirectory()) {
        return {
          entryCount: 0,
          exists: true,
          isDirectory: false,
        };
      }

      const entries = await readdir(absolutePath);

      return {
        entryCount: entries.length,
        exists: true,
        isDirectory: true,
      };
    } catch {
      return {
        entryCount: 0,
        exists: false,
        isDirectory: false,
      };
    }
  };

  return inspectRelativePath;
};

const createWarnings = (
  coreEnvironment: Record<CoreEnvKey, boolean>,
  filesystem: HarnessReport['filesystem']
): string[] => {
  const warnings: string[] = [];

  if (!coreEnvironment.GOOGLE_API_KEY) {
    warnings.push('GOOGLE_API_KEY 가 비어 있어서 /api/image/search 와 관련 흐름이 실패함');
  }

  if (!coreEnvironment.GOOGLE_CSE_ID) {
    warnings.push('GOOGLE_CSE_ID 가 비어 있어서 Google 이미지 검색 하네스가 완전하지 않음');
  }

  if (!filesystem.docs.exists) {
    warnings.push('docs 디렉토리가 없어서 레포 지식 문서화가 약해짐');
  }

  if (!filesystem.samples.root.exists) {
    warnings.push('_samples 디렉토리가 없어서 로컬 예시 하네스를 재현하기 어려움');
  }

  return warnings;
};

export const createHarnessReport = async (
  runtimeOverrides: Partial<HarnessRuntime> = {}
): Promise<HarnessReport> => {
  const cwd = runtimeOverrides.cwd ?? process.cwd();
  const env = runtimeOverrides.env ?? process.env;
  const inspectRelativePath =
    runtimeOverrides.inspectRelativePath ?? createDefaultInspector(cwd);
  const now = runtimeOverrides.now ?? (() => new Date().toISOString());

  const [
    docsInspection,
    samplesRootInspection,
    samplesExamplesInspection,
    samplesInputInspection,
    samplesOutputInspection,
  ] = await Promise.all(
    [
      inspectRelativePath('docs'),
      inspectRelativePath('_samples'),
      inspectRelativePath('_samples/examples'),
      inspectRelativePath('_samples/input'),
      inspectRelativePath('_samples/output'),
    ] as const
  );

  const coreEnvironment = createEnvironmentStatus(CORE_ENV_KEYS, env);
  const optionalEnvironment = createEnvironmentStatus(OPTIONAL_ENV_KEYS, env);

  const filesystem = {
    docs: createPathSummary('docs', docsInspection),
    samples: {
      examples: createPathSummary('_samples/examples', samplesExamplesInspection),
      input: createPathSummary('_samples/input', samplesInputInspection),
      output: createPathSummary('_samples/output', samplesOutputInspection),
      root: createPathSummary('_samples', samplesRootInspection),
    },
  };

  const warnings = createWarnings(coreEnvironment, filesystem);

  return {
    apiSurface: [...API_SURFACE],
    environment: {
      core: coreEnvironment,
      integrations: {
        awsS3Configured:
          hasValue(env.AWS_ACCESS_KEY_ID) &&
          hasValue(env.AWS_SECRET_ACCESS_KEY) &&
          hasValue(env.AWS_S3_BUCKET),
        googleSheetsConfigured:
          hasValue(env.GOOGLE_SERVICE_ACCOUNT_EMAIL) &&
          hasValue(env.GOOGLE_PRIVATE_KEY),
        grokConfigured: hasValue(env.GROK_API_KEY),
        translateConfigured: hasValue(env.GOOGLE_TRANSLATE_API_KEY),
      },
      optional: optionalEnvironment,
    },
    filesystem,
    generatedAt: now(),
    project: {
      agentEntryPoints: ['AGENT.md', 'docs/harness-engineering.md', '/api/harness', '/harness'],
      name: path.basename(cwd),
      rootDirectory: cwd,
    },
    status: warnings.length === 0 ? 'ready' : 'attention',
    workflow: {
      automation: {
        ci: {
          enabled: true,
          path: '.github/workflows/verify-task.yml',
        },
        hooks: {
          commitMessage: {
            enabled: true,
            path: '.githooks/commit-msg',
          },
          commitTemplate: {
            enabled: true,
            path: '.gitmessage',
          },
          preCommit: {
            enabled: true,
            path: '.githooks/pre-commit',
          },
        },
      },
      commitPolicy: {
        mode: 'verify_then_commit',
        summary: '매 작업마다 테스트 우선 작성, 원하는 결과 확인, 전체 테스트와 엄격한 린트 검증 후 pre-commit 과 commit-msg 규칙까지 통과한 상태로 커밋함',
      },
      requiredTaskSteps: REQUIRED_TASK_STEPS.map(({ commandHints, description, id, title }) => ({
        commandHints: [...commandHints],
        description,
        id,
        title,
      })),
    },
    verification: {
      recommendedCommands: [
        'pnpm build:check',
        'pnpm hooks:install',
        'pnpm verify:task',
        'pnpm harness:check',
        'pnpm test:run',
        'pnpm lint',
        'git status --short',
      ],
      warnings,
    },
  };
};
