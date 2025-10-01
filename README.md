# 🔍 Google Image to PNG Service

Google 이미지 검색 결과를 PNG 형식으로 변환하여 다운로드할 수 있는 Next.js 14 기반 웹 서비스입니다.

## ✨ 주요 기능

- 🔍 **Google 이미지 검색**: 키워드로 이미지 검색
- 🖼️ **PNG 변환**: JPG/WebP 등 모든 이미지를 PNG로 변환
- 📱 **반응형 UI**: 모바일부터 데스크톱까지 최적화
- ⚡ **빠른 처리**: Sharp 라이브러리로 고성능 이미지 처리
- 🎨 **현대적 디자인**: TailwindCSS로 세련된 UI

## 🚀 빠른 시작

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

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **Custom Search API** 활성화
3. API 키 생성
4. [Google Custom Search Engine](https://cse.google.com/cse/)에서 검색 엔진 생성
   - 검색할 사이트: `www.google.com`
   - 이미지 검색 활성화
   - Search Engine ID 복사

### 5. 개발 서버 실행

```bash
npm run dev
# 또는
pnpm dev
# 또는
yarn dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요!

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── image/
│   │       ├── search/    # 이미지 검색 API
│   │       └── proxy/     # PNG 변환 프록시 API
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

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Image Processing**: Sharp
- **API**: Google Programmable Search API

## 📖 API 문서

### GET /api/image/search

이미지 검색을 수행합니다.

**Parameters:**
- `q` (string, required): 검색 키워드
- `n` (number, optional): 결과 개수 (1-10, 기본값: 10)

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
        "pngUrl": "/api/image/proxy?src=..."
      }
    ],
    "totalResults": "1000",
    "searchTime": 0.5
  }
}
```

### GET /api/image/proxy

이미지를 PNG로 변환하여 반환합니다.

**Parameters:**
- `src` (string, required): 원본 이미지 URL (URL 인코딩 필요)
- `w` (number, optional): 너비 (1-4000)
- `h` (number, optional): 높이 (1-4000)

**Response:** PNG 이미지 데이터

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|---------|
| `GOOGLE_API_KEY` | Google API 키 | - |
| `GOOGLE_CSE_ID` | Custom Search Engine ID | - |
| `IMAGE_CACHE_SECONDS` | 이미지 캐시 시간(초) | 3600 |

## 🚨 주의사항

1. **API 사용량**: Google Custom Search API는 하루 100회 무료 호출 제한이 있습니다.
2. **저작권**: 모든 이미지의 저작권은 원본 소유자에게 있습니다.
3. **보안**: `.env.local` 파일은 절대 버전 관리에 포함하지 마세요.

## 📝 라이선스

MIT License

## 🎯 개발자

Made with ❤️ by **케인님**

- GitHub: [Your GitHub]
- Email: [Your Email]

---

### 🎪 케인식 개발 철학

"아이고난1! 움직임이 예사롭지 않은 것은 맞아! 잠시 소란이 있었어요."

이 프로젝트는 케인님의 독특한 개발 철학으로 만들어졌습니다:
- Sharp로 PNG 변환 → "나는! 나는..! 장풍을..!! 했다!!"
- Google API 연동 → "예전에 하던 놈 같은데"
- 에러 처리 → "안 감사합니다"
- 최종 완성 → "오옹! 나이스!"