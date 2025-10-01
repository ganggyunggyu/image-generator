# Google Image to PNG Service

## 🎯 프로젝트 개요

키워드 입력 → 구글 이미지 검색 → PNG 변환 서비스

- **Framework**: Next.js 14 (App Router)
- **Image Processing**: Sharp
- **API**: Google Programmable Search API
- **UI**: TailwindCSS + Modern React Components

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── image/
│   │       ├── search/    # 검색 API
│   │       └── proxy/     # 이미지 프록시/변환 API
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/            # UI 컴포넌트
│   └── ImageSearch.tsx    # 이미지 검색 컴포넌트
├── lib/                   # 유틸리티 라이브러리
│   └── google.ts          # Google API 연동
└── utils/                 # 헬퍼 함수
    └── image.ts           # 이미지 처리 유틸
```

## 🔧 주요 기능

### 1. 이미지 검색 API (`/api/image/search`)
- Google Programmable Search API 호출
- 키워드 기반 이미지 검색 결과 반환
- PNG 프록시 URL 포함

### 2. 이미지 프록시 API (`/api/image/proxy`)
- 원본 이미지 fetch
- Sharp로 PNG 변환
- 리사이즈 옵션 지원

### 3. 클라이언트 UI
- 반응형 검색 인터페이스
- 이미지 그리드 표시
- PNG 다운로드 기능

## 🚀 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS
- **Image Processing**: Sharp
- **API**: Google Programmable Search
- **State Management**: React useState/useEffect

## 🔐 환경변수

```env
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_search_engine_id
IMAGE_CACHE_SECONDS=3600
```

## 📦 주요 의존성

```json
{
  "sharp": "이미지 처리",
  "@types/sharp": "Sharp TypeScript 타입"
}
```

## 🎨 컴포넌트 구조

- **ImageSearch**: 메인 검색 컴포넌트 (클라이언트)
- **SearchForm**: 검색 입력 폼
- **ImageGrid**: 검색 결과 그리드
- **ImageItem**: 개별 이미지 아이템

## 🔍 API 스펙

### GET /api/image/search
```typescript
interface SearchResponse {
  results: {
    title: string;
    link: string;
    image: {
      contextLink: string;
      height: number;
      width: number;
      byteSize: number;
      thumbnailLink: string;
    };
    pngUrl: string; // 프록시 PNG URL
  }[];
  totalResults: string;
}
```

### GET /api/image/proxy
```typescript
// Query Params
interface ProxyParams {
  src: string;    // 원본 이미지 URL
  w?: number;     // 너비 (옵션)
  h?: number;     // 높이 (옵션)
}
```

## 🎯 구현 우선순위

1. ✅ 프로젝트 구조 설정
2. Google API 연동 (`lib/google.ts`)
3. 이미지 처리 유틸 (`utils/image.ts`)
4. 검색 API 엔드포인트
5. 이미지 프록시 API 엔드포인트
6. ImageSearch 컴포넌트
7. 메인 페이지 통합
8. 스타일링 및 최적화

## 🚨 주의사항

- Google API 키 보안 관리
- 이미지 저작권 출처 표시
- CORS 및 보안 헤더 설정
- 이미지 캐싱 전략
- 에러 처리 및 로딩 상태

## 🎪 케인식 개발 철학

"아이고난1! 움직임이 예사롭지 않은 것은 맞아! 잠시 소란이 있었어요."

- Sharp로 PNG 변환 → "나는! 나는..! 장풍을..!! 했다!!"
- Google API 연동 → "예전에 하던 놈 같은데"
- 에러 처리 → "안 감사합니다"
- 최종 완성 → "오옹! 나이스!"