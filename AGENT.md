# temp-image-gen · 케인 전용 AGENT 가이드

## 프로젝트 한줄 요약
- Next.js 14(App Router) + TypeScript + TailwindCSS v4 + Sharp. Google Programmable Search API로 이미지 검색 → `/api/image/proxy`에서 WebP 변환 후 UI에 뿌리고, Jotai로 클라이언트 상태 관리. JSZip으로 일괄 다운로드 제공.

## 구조 메모 (FSD 준수)
- `src/app` 라우트(API 포함), `src/pages` 뷰 래퍼, `src/widgets/image-search` 화면 조립, `src/features/image-search` 비즈니스 훅/로직, `src/entities/image` 아톰/타입, `src/shared` 공용 UI(lib/cn 필수), `src/utils` 헬퍼(google/url/image 등).
- 절대경로 import만 사용(`@/`), React.Fragment 축약 금지, 모든 className은 `cn()` 사용.
- FE 신규 데이터 패칭 시 TanStack Query 기본 셋업(Provider + `useQuery`/`useMutation`) 후 사용. 이미 있는 로컬 상태는 Jotai 유지하되 서버 통신은 Query 우선.

## 주요 플로우
- `/api/image/search`: `getGoogleImageResults` → Google CSE 최대 10개씩 다회 호출 후 결과 가공(imageUrl은 proxy 경유). 현재 buffer 1.5배, random 모드는 startIndex 랜덤.
- `/api/image/proxy`: `fetchImageBuffer`로 원본 fetch → `convertToWebp` 변환 → 캐시 헤더 반환.
- 클라이언트: `useImageSearch`가 검색/검증(이미지 onload로 5개씩 병렬 확인), `useBulkDownload`가 선택/ZIP 다운로드 처리.

## 성능/품질 체크포인트
- 검색 지연 원인: (1) `getGoogleImageResults`가 buffer 1.5배로 최대 5회 순차 호출 + 200ms sleep, (2) random 모드로 startIndex 중복 방지하며 추가 딜레이, (3) 클라이언트 검증 시 `/api/image/proxy`를 5개 병렬 호출.
- 개선 우선순위 예시
  - Google 호출을 `Promise.all` + `p-limit`로 동시 2~3개 제한, buffer 1.2~1.3로 축소, random도 고정된 startIndex 리스트 1~30까지만 사용.
  - query 기반 인메모리 캐시(10~15분 TTL) or Next `revalidateTag`/`Cache-Control`로 동일 검색어 재사용.
  - 검증 배치 크기/타임아웃 튜닝(batch 8~10, timeout 3s) 및 실패 시 재시도 없이 스킵.
  - `/api/image/proxy`에 `Accept-Ranges`·`etag` 등 캐싱 헤더 추가 검토, Sharp 옵션 `effort`/`quality`로 속도-품질 밸런스 조절.

## 스타일/UX 수칙
- 모던/미니멀 톤, 아이콘 라이브러리 우선(이모지 지양). Tailwind는 `cn`으로 합성, 반응형 모바일 우선. 불필요 주석 금지.
- 상태/액션 네이밍: `handleX`, boolean `isX`, 리스트 `XList`. 다운로드/검색 진행률은 짧은 문구 유지.

## 실행/의존성
- 패키지 매니저: pnpm(LOCK 존재). 스크립트: `pnpm dev|build|start|lint`. Sharp/JSZip/p-limit/jotai/tailwind-merge 포함.
- 환경변수: `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`, `IMAGE_CACHE_SECONDS`(기본 3600). 키 없으면 검색 실패.

## 지금 바로 주의할 리스크
- Google API 다중 호출로 응답 지연 및 quota 소모 가속. 병렬/캐시 최적화 없이 imageCount↑ 시 UX 급저하.
- 이미지 검증이 프록시 API에 몰려 서버 부하 가능. 배치/timeout 조정 필요.
- tailwind v4 사용 중이니 플러그인/문법 v4 가이드 준수.
