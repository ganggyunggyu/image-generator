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
