# temp-image-gen · 케인 전용 AGENT 가이드

## 프로젝트 요약
- Next.js(App Router) + TypeScript + Tailwind CSS v4 기반.
- Google Programmable Search API로 이미지 검색 후 `/api/image/proxy`에서 Sharp로 WebP 변환.
- Jotai 상태 관리, JSZip으로 일괄 다운로드, frame-filter로 효과 적용 다운로드 지원.

## 구조 (FSD)
- `src/app`: App Router, API 라우트, 레이아웃/글로벌 스타일.
- `src/pages`: 페이지 컴포넌트 래퍼 (`HomePage`).
- `src/widgets/image-search`: 화면 조립/섹션 UI.
- `src/features/image-search`: 검색/다운로드 훅과 비즈니스 로직.
- `src/entities/image`: 상태(atom)와 타입.
- `src/shared`: `cn`, 공용 UI, frame-filter 등.
- `src/lib`: Google 검색 API 래퍼.
- `src/utils`: 이미지/URL/배열/브라우저 헬퍼.

## 핵심 플로우
- `/api/image/search` -> `getGoogleImageResults` -> 결과 가공(`imageUrl`은 프록시 경유) + 캐시(15분 TTL).
- `/api/image/proxy` -> 원본 fetch -> WebP 변환 -> 캐시 헤더 반환.
- 클라이언트는 `useImageSearch`에서 검색 후 `validateImages`로 브라우저 검증.
- 일괄 다운로드는 `/api/image/bulk-download` 또는 `/api/image/bulk-download-processed` 사용.

## 상태/선택 모델
- 선택 상태는 결과 index 기반 (`selectedImages: Set<number>`).
- 결과 정렬이 바뀌면 index 기준 선택이 깨질 수 있으니 순서 유지 전제.

## 개발 규칙 (프로젝트 적용)
- 절대경로 import (`@/`)만 사용.
- 모든 className은 `cn()` 사용.
- React.Fragment 사용, `<>` 금지.
- 구조분해할당 우선.
- 이모지 대신 아이콘 라이브러리 우선.
- 서버 데이터 통합 시 TanStack Query Provider + hooks 세팅 필수.

## 실행/환경
- 패키지 매니저: pnpm.
- 스크립트: `pnpm dev|build|start|lint`.
- 환경변수: `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`, `IMAGE_CACHE_SECONDS`.
- 서버 실행 요청 없으면 실행하지 않기.

## 프로젝트 스킬
- 입력 폴더 처리와 S3 업로드 작업의 source of truth 는 `.claude/commands/image-process.md`.
- 애견/안과/알리바바 입력 처리 요청을 받으면 먼저 `.claude/commands/image-process.md` 를 읽고 그 순서를 따르기.
- 애견 로컬 입력 작업의 기본 순서는 `pnpm -s process:pet:local` -> `pnpm -s category:pet:local` -> `pnpm -s upload:blog -- "./_samples/output/애견_출력"` 임.
- 애견 NAS 입력 작업의 기본 순서는 `pnpm -s process:pet:nas` -> `pnpm -s category:pet:nas` -> `pnpm -s upload:pet:nas` 임.
- 기존 호환용 `pnpm -s process:pet` 와 `pnpm -s category:pet` 는 로컬 프로세서를 가리킴.
- 애견 출력 검토에서 매핑/이미지/metadata/키워드 txt 이상 없으면 사용자 재확인 없이 바로 업로드함.
- 알리바바 입력 작업의 기본 순서는 `pnpm -s process:alibaba` -> `pnpm -s upload:blog -- "./_samples/output/알리바바_출력"` 임.
- `process:alibaba` 는 출력 루트에 `키워드_계정매칭.txt` 를 자동 생성해야 함.
- `process:pet` 와 `category:pet` 는 병렬 실행하지 말고 순차 실행하기.
- 업로드 완료 여부는 로컬 출력만 보지 말고 S3 `product-images/{blogId}/` 상태까지 확인하기.

## Harness Entry Points
- 작업 진입 문서: `docs/harness-engineering.md`
- 기계 진단 surface: `GET /api/harness`
- 사람 확인 surface: `/harness`
- 빠른 검증 루프: `pnpm harness:check`, `pnpm test:run`, `pnpm lint`, `pnpm build:check`

## Per-Task Harness Contract
- 원하는 결과와 실패 조건을 먼저 정의.
- 구현 전에 테스트 코드 추가 또는 기존 테스트 수정.
- 관련 테스트나 재현 절차로 원하는 결과를 직접 확인.
- 작업 마무리 전에 `pnpm test:run`, `pnpm lint`, `pnpm build:check` 재실행.
- `git status --short` 로 diff 를 검토해 커밋 가능한 상태인지 확인하고, 요청이 있으면 의미 단위로 바로 커밋.

## Enforcement
- `pnpm hooks:install` 으로 `.githooks` 와 `.gitmessage` 를 로컬 git config 에 연결.
- pre-commit 에서 `pnpm verify:task` 자동 실행.
- `pnpm lint` 는 warning 도 실패로 처리.
- `pnpm build:check` 는 build warning 도 실패로 처리.
- commit-msg 에서 `Expected`, `Verification`, `Tests` 줄 필수.
- CI 에서 `.github/workflows/verify-task.yml` 로 동일 게이트 재실행.
