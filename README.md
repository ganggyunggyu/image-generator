# Google Image Search & Download Service

Google 이미지 검색 결과를 WebP 형식으로 변환하여 다운로드할 수 있는 Next.js 14 기반 웹 서비스입니다.

## 주요 기능

### 이미지 검색 및 다운로드
- **Google 이미지 검색**: 키워드로 이미지 검색
- **WebP 변환**: 모든 이미지를 고품질 WebP 형식으로 자동 변환
- **일괄 다운로드**: 최대 30개 이미지를 ZIP 파일로 일괄 다운로드
- **정렬 옵션**: 원본 순서 또는 랜덤 순서로 정렬

### 이미지 효과
- **프레임 적용**: 클래식, 모던, 빈티지 등 다양한 액자 스타일
- **필터 적용**: 흑백, 세피아, 비네트 등 이미지 필터
- **랜덤 효과**: 각 이미지에 랜덤 프레임/필터 자동 적용

### 사용자 경험
- **반응형 UI**: 모바일부터 데스크톱까지 최적화
- **빠른 처리**: Sharp 라이브러리로 고성능 이미지 처리
- **투명 배경 지원**: WebP 형식으로 투명도 유지
- **현대적 디자인**: TailwindCSS로 세련된 UI

## 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd google-image-to-png
```

### 2. 의존성 설치

```bash
npm install
# 또는
pnpm install
# 또는
yarn install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here
IMAGE_CACHE_SECONDS=3600
```

### 4. Google API 설정

#### API 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **Custom Search API** 활성화
3. API 키 생성하여 `GOOGLE_API_KEY`에 입력

#### Custom Search Engine 설정
1. [Google Custom Search Engine](https://cse.google.com/cse/)에서 검색 엔진 생성
2. 검색할 사이트: **전체 웹 검색**으로 설정
3. 이미지 검색 활성화
4. Search Engine ID를 복사하여 `GOOGLE_CSE_ID`에 입력

### 5. 개발 서버 실행

```bash
npm run dev
# 또는
pnpm dev
# 또는
yarn dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요!

### 6. 프로덕션 빌드

```bash
npm run build
npm run start
```

## 프로젝트 구조

Feature-Sliced Design (FSD) 아키텍처를 따릅니다.

```
src/
├── app/                           # Next.js App Router
│   ├── api/image/                # API Routes
│   │   ├── search/              # 이미지 검색 API
│   │   ├── proxy/               # WebP 변환 프록시 API
│   │   ├── bulk-download/       # 일괄 다운로드 API
│   │   └── bulk-download-processed/ # 효과 적용 다운로드 API
│   ├── globals.css              # 전역 스타일
│   ├── layout.tsx               # 루트 레이아웃
│   └── page.tsx                 # 메인 페이지
├── entities/                     # 비즈니스 엔티티
│   └── image/                   # 이미지 관련 상태 관리
├── features/                     # 기능 단위
│   └── image-search/            # 이미지 검색 기능
│       └── hooks/               # 커스텀 훅
├── widgets/                      # 페이지 단위 컴포넌트
│   └── image-search/            # 이미지 검색 위젯
│       ├── hooks/               # 위젯 전용 훅
│       └── ui/                  # UI 컴포넌트
├── shared/                       # 공유 리소스
│   ├── api/                     # API 타입 정의
│   ├── lib/                     # 공통 라이브러리
│   │   └── frame-filter/       # 프레임/필터 시스템
│   └── ui/                      # 공통 UI 컴포넌트
├── lib/                          # 외부 API 연동
│   └── google.ts                # Google Search API
└── utils/                        # 유틸리티 함수
    └── image/                   # 이미지 처리 유틸
        ├── convert.ts           # WebP 변환
        ├── fetch.ts             # 이미지 다운로드
        └── validate.ts          # 이미지 검증
```

## 기술 스택

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **React**: React 19

### Styling
- **UI Framework**: TailwindCSS
- **CSS**: PostCSS with Autoprefixer

### Image Processing
- **Image Library**: Sharp (고성능 이미지 처리)
- **Archive**: JSZip (ZIP 파일 생성)

### State Management
- **Global State**: Jotai (Atomic state management)

### API
- **External**: Google Programmable Search API

## API 문서

### GET /api/image/search

이미지 검색을 수행합니다.

**Parameters:**
- `q` (string, required): 검색 키워드
- `n` (number, optional): 결과 개수 (1-30, 기본값: 10)
- `sortOrder` (string, optional): 정렬 순서 (`original` | `random`, 기본값: `random`)

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "고양이",
    "results": [
      {
        "title": "귀여운 고양이",
        "link": "https://example.com/cat.jpg",
        "image": {
          "contextLink": "https://example.com",
          "height": 300,
          "width": 400,
          "byteSize": 50000,
          "thumbnailLink": "https://example.com/thumb.jpg"
        },
        "imageUrl": "/api/image/proxy?src=..."
      }
    ],
    "totalResults": "1000",
    "searchTime": 0.5
  }
}
```

### GET /api/image/proxy

이미지를 WebP로 변환하여 반환합니다.

**Parameters:**
- `src` (string, required): 원본 이미지 URL (URL 인코딩 필요)
- `w` (number, optional): 너비 (1-4000)
- `h` (number, optional): 높이 (1-4000)

**Features:**
- 자동 WebP 변환 (quality: 90)
- 이미지 리사이징 (fit: contain)
- 투명 배경 지원
- 캐싱 지원

**Response:** WebP 이미지 데이터

**Headers:**
- `Content-Type`: image/webp
- `Cache-Control`: public, max-age={IMAGE_CACHE_SECONDS}
- `X-Original-URL`: 원본 이미지 URL
- `X-Content-Size`: 변환된 이미지 크기

### POST /api/image/bulk-download

선택한 이미지를 ZIP 파일로 일괄 다운로드합니다.

**Request Body:**
```json
{
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "title": "이미지 제목",
      "width": 800,
      "height": 600
    }
  ],
  "keyword": "고양이"
}
```

**Response:** ZIP 파일

**Headers:**
- `Content-Type`: application/zip
- `Content-Disposition`: attachment; filename*=UTF-8''keyword.zip (검색어가 없으면 images_타임스탬프.zip)
- `X-Success-Count`: 성공한 이미지 개수
- `X-Failed-Count`: 실패한 이미지 개수

### POST /api/image/bulk-download-processed

프레임/필터 효과가 적용된 이미지를 ZIP 파일로 다운로드합니다.

**Request Body:**
```json
{
  "processedImages": [
    {
      "url": "https://example.com/image.jpg",
      "title": "이미지 제목",
      "width": 1200,
      "height": 1200,
      "imageUrl": "/api/image/proxy?src=...",
      "processedDataUrl": "data:image/webp;base64,..."
    }
  ],
  "effectOptions": {
    "frame": {
      "id": "classic",
      "name": "클래식"
    },
    "filter": {
      "id": "grayscale",
      "name": "흑백"
    }
  },
  "keyword": "고양이"
}
```

**Response:** ZIP 파일 (효과가 적용된 이미지 포함)

**Headers:**
- `Content-Disposition`: attachment; filename*=UTF-8''keyword.zip (검색어가 없으면 images_타임스탬프.zip)

## 환경 변수

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|---------|
| `GOOGLE_API_KEY` | Google API 키 | Yes | - |
| `GOOGLE_CSE_ID` | Custom Search Engine ID | Yes | - |
| `IMAGE_CACHE_SECONDS` | 이미지 캐시 시간(초) | No | 3600 |

## 주요 기능 상세

### 이미지 검색
- Google Custom Search API를 사용한 이미지 검색
- 랜덤 모드: 30개 수집 후 Fisher-Yates 셔플 적용
- URL 필터링: 동영상 플랫폼 및 리다이렉트 URL 차단
- 다양한 이미지 소스 허용 (블로그, SNS 등)

### WebP 변환
- Sharp 라이브러리 사용
- Quality 90으로 고품질 변환
- Fit 'contain' 모드로 이미지 잘림 방지
- 투명 배경 지원 (alpha: 0)
- 자동 리사이징

### 프레임/필터 시스템
- **프레임**: 클래식, 모던, 빈티지, 골드, 실버, 우드 등
- **필터**: 흑백, 세피아, 비네트, 블러, 샤픈 등
- **랜덤 옵션**: 각 이미지마다 다른 효과 자동 적용

### 일괄 다운로드
- 최대 30개 이미지 동시 다운로드
- ZIP 압축 (compression level: 6)
- 파일명 자동 정리 (특수문자 제거)
- 에러 발생 시 실패 목록 포함

## 주의사항

### API 사용량
- Google Custom Search API는 **하루 100회 무료 호출** 제한이 있습니다.
- 초과 시 유료 전환 또는 다음 날까지 대기 필요

### 저작권
- 모든 이미지의 저작권은 원본 소유자에게 있습니다.
- 상업적 사용 전 저작권 확인 필수

### 보안
- `.env.local` 파일은 절대 버전 관리에 포함하지 마세요.
- API 키 노출 주의

### 성능
- 대량 다운로드 시 서버 메모리 사용량 증가
- 이미지 처리 중 타임아웃 가능성 있음

## 개발 가이드

### 코드 스타일
- TypeScript strict mode 사용
- ESLint + Next.js 권장 설정
- 함수형 컴포넌트 및 Hooks 사용

### 상태 관리
- Jotai를 사용한 Atomic 상태 관리
- `entities/image/model/atoms.ts`에 상태 정의

### 컴포넌트 작성
- FSD 아키텍처 준수
- shared/ui에 공통 컴포넌트 배치
- 각 레이어의 의존성 규칙 준수

## 라이선스

MIT License

## 개발자

Made with ❤️ by **케인님**

---

### 케인식 개발 철학

"아이고난1! 움직임이 예사롭지 않은 것은 맞아! 잠시 소란이 있었어요."

이 프로젝트는 케인님의 독특한 개발 철학으로 만들어졌습니다:
- Sharp로 WebP 변환 → "나는! 나는..! 장풍을..!! 했다!!"
- Google API 연동 → "예전에 하던 놈 같은데"
- 에러 처리 → "안 감사합니다"
- 최종 완성 → "오옹! 나이스!"
