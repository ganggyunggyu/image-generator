# Harness Engineering

이 프로젝트는 하네스 엔지니어링 관점에서 다음 세 가지를 시스템 오브 레코드로 둡니다.

- `AGENT.md`: 사람과 에이전트가 가장 먼저 읽는 레포 운영 요약
- `docs/harness-engineering.md`: 진입 순서, 검증 루프, 업데이트 규칙
- `GET /api/harness`: 현재 레포 상태를 기계가 바로 읽을 수 있는 진단 JSON
- `/harness`: 현재 레포 상태를 사람이 한눈에 읽는 대시보드

## 목적

- 레포 지식을 문서와 코드 안에 남겨 에이전트가 추측하지 않게 하기
- 변경 전후 상태를 빠르게 비교할 수 있는 진단 surface 만들기
- 테스트와 린트를 한 번에 잇는 짧은 검증 루프 유지하기

## Golden Path

1. `AGENT.md` 와 이 문서를 읽기
2. `pnpm harness:check` 로 현재 상태를 확인하기
3. 원하는 결과와 실패 조건을 먼저 적기
4. 관련 API route 와 기존 테스트를 먼저 읽기
5. 테스트를 먼저 추가 또는 수정한 뒤 구현하기
6. 관련 테스트 또는 재현 절차로 원하는 결과가 나오는지 직접 확인하기
7. `pnpm test:run`, `pnpm lint`, `pnpm build:check` 순서로 검증하기
8. `git status --short` 로 commit 가능한 상태인지 확인하고 필요하면 바로 커밋하기

로컬에서는 `.githooks/pre-commit` 이 `pnpm verify:task` 를 자동 실행하고, `.githooks/commit-msg` 가 `Expected`, `Verification`, `Tests` 줄이 있는지 검사합니다.
원격에서는 `.github/workflows/verify-task.yml` 이 같은 `pnpm verify:task` 를 다시 실행합니다.

## Machine-Readable Surface

`GET /api/harness` 는 다음 정보를 반환합니다.

- 핵심 환경변수 준비 여부
- 선택적 통합 환경 준비 여부
- `docs`, `_samples` 디렉토리 존재 여부와 엔트리 수
- 핵심 API surface 목록
- 매 작업마다 따라야 하는 테스트 우선/검증/커밋 체크리스트
- 로컬 훅과 CI 강제 지점
- 추천 검증 명령과 현재 경고 목록

`/harness` 는 같은 정보를 카드형 레이아웃으로 다시 보여주며, 검색 화면에서 바로 이동할 수 있습니다.

## Per-Task Contract

아래는 매 작업마다 반드시 확인하는 하네스 계약입니다.

1. 원하는 결과와 실패 조건을 먼저 정의합니다.
2. 구현 전에 테스트 코드를 추가하거나 기존 테스트를 수정합니다.
3. 최소 수정으로 구현합니다.
4. 관련 테스트 또는 재현 절차로 원하는 결과가 나왔는지 직접 확인합니다.
5. `pnpm test:run`, `pnpm lint`, `pnpm build:check` 로 전체 회귀와 build warning 을 확인합니다.
6. `git status --short` 로 diff 를 검토해 커밋 가능한 상태인지 확인하고, 요청이 있으면 의미 단위로 바로 커밋합니다.

## Enforcement

- 로컬 훅 설치: `pnpm hooks:install`
- 로컬 게이트: `pnpm verify:task`
- build warning 게이트: `pnpm build:check`
- pre-commit 훅: `.githooks/pre-commit`
- commit-msg 훅: `.githooks/commit-msg`
- commit template: `.gitmessage`
- CI 게이트: `.github/workflows/verify-task.yml`

## Verification Loop

- `pnpm harness:check`
- `pnpm verify:task`
- `pnpm build:check`
- `pnpm harness:check --strict`
- `pnpm test:run`
- `pnpm lint`

## Update Rules

새 API, 새 환경변수, 새 샘플 입력 규칙이 생기면 아래도 함께 갱신합니다.

- `src/shared/lib/harness/create-harness-report.ts`
- `docs/harness-engineering.md`
- 필요하면 `AGENT.md`

핵심 흐름에 계약이 생기면 route test 또는 lib test를 먼저 추가합니다.
