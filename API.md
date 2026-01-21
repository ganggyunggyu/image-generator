# Image Generator API 명세

Base URL: `https://image-generator-dsga.vercel.app`

---

## 1. 이미지 검색

Google Custom Search API를 통한 이미지 검색

### `GET /api/image/search`

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| q | string | O | 검색 키워드 |
| n | number | X | 결과 개수 (기본: 10) |
| sortOrder | string | X | 정렬 순서: `original` \| `random` (기본: random) |

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "강아지",
    "results": [
      {
        "title": "이미지 제목",
        "link": "https://example.com/image.jpg",
        "imageUrl": "https://example.com/image.jpg",
        "previewUrl": "https://example.com/thumb.jpg",
        "width": 1200,
        "height": 800
      }
    ],
    "totalResults": 100,
    "searchTime": 0.5,
    "timestamp": "2026-01-21T05:50:00.000Z"
  },
  "message": "10개의 이미지를 찾았습니다"
}
```

---

## 2. 이미지 프록시

외부 이미지를 WebP로 변환하여 프록시

### `GET /api/image/proxy`

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| src | string | O | 이미지 URL (URL 인코딩) |
| w | number | X | 너비 (1-4000) |
| h | number | X | 높이 (1-4000) |
| q | number | X | 품질 (1-100, 기본: 92) |

**Response:** `image/webp` 바이너리

**Response Headers:**
- `X-Original-URL`: 원본 이미지 URL
- `X-Content-Size`: 변환된 이미지 크기
- `X-Resized`: 리사이즈 정보 (w, h 사용 시)

---

## 3. 랜덤 액자 이미지

이미지 검색 → 랜덤 액자/필터 적용 → S3 업로드 → URL 리턴

### `POST /api/image/random-frames`

**Request:**
```json
{
  "keyword": "강아지",
  "count": 5
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| keyword | string | O | 검색 키워드 |
| count | number | X | 이미지 개수 (기본: 5, 최대: 10) |

**Response:**
```json
{
  "images": [
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260121_abc12345.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260121_def67890.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260121_ghi13579.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260121_jkl24680.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260121_mno98765.webp" }
  ],
  "total": 5,
  "failed": 0
}
```

**필드 설명:**

| 필드 | 타입 | 설명 |
|------|------|------|
| images | `List[ImageItem]` | 생성된 이미지 URL 배열 |
| images[].url | string | 이미지 URL (S3) |
| total | int | 성공한 이미지 개수 |
| failed | int | 실패한 이미지 개수 |

**S3 URL 구조:**
```
https://{BUCKET}.s3.{REGION}.amazonaws.com/search-images/{keyword}/{YYYYMMDD}_{uuid8}.webp
```

**랜덤 선택 규칙:**
- 액자: classic, modern, gold, wood, vintage 중 랜덤 (none 제외)
- 필터: none, grayscale, sepia, vintage, warm, cool, dramatic 중 랜덤

---

## 4. 일괄 다운로드

이미지 목록을 받아 효과 적용 후 ZIP으로 반환

### `POST /api/image/bulk-download`

**Request:**
```json
{
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "title": "이미지 제목",
      "fallbackUrls": ["https://backup.com/image.jpg"]
    }
  ],
  "keyword": "강아지",
  "effectOptions": {
    "filter": { "id": "grayscale", "name": "흑백", "type": "grayscale" },
    "frame": { "id": "classic", "name": "클래식", "borderWidth": 20, "borderColor": "#8B4513" }
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| images | array | O | 이미지 정보 배열 |
| images[].url | string | O | 이미지 URL |
| images[].title | string | O | 파일명 |
| images[].fallbackUrls | string[] | X | 대체 URL 목록 |
| keyword | string | X | ZIP 파일명에 사용 |
| effectOptions | object | X | 액자/필터 옵션 |

**Response:** `application/zip` 바이너리

**Response Headers:**
- `X-Success-Count`: 성공한 이미지 수
- `X-Failed-Count`: 실패한 이미지 수
- `X-Total-Count`: 전체 이미지 수

---

## 5. 처리된 이미지 일괄 다운로드

클라이언트에서 이미 효과 적용된 base64 이미지를 ZIP으로 반환

### `POST /api/image/bulk-download-processed`

**Request:**
```json
{
  "processedImages": [
    {
      "url": "https://example.com/image.jpg",
      "title": "이미지 제목",
      "imageUrl": "https://example.com/image.jpg",
      "processedDataUrl": "data:image/png;base64,..."
    }
  ],
  "keyword": "강아지",
  "effectOptions": {
    "filter": { "id": "grayscale", "name": "흑백" },
    "frame": { "id": "classic", "name": "클래식" }
  }
}
```

**Response:** `application/zip` 바이너리

---

## 에러 응답

모든 API는 에러 시 아래 형식으로 응답:

```json
{
  "success": false,
  "error": "에러 메시지 (한글)",
  "message": "Error message (English)",
  "timestamp": "2026-01-21T05:50:00.000Z"
}
```

| 상태 코드 | 설명 |
|-----------|------|
| 400 | 잘못된 요청 (필수 파라미터 누락) |
| 404 | 검색 결과 없음 |
| 413 | 요청 크기 초과 |
| 422 | 지원하지 않는 형식 |
| 429 | API 사용 한도 초과 |
| 500 | 서버 내부 오류 |
| 502 | 외부 서비스 연결 실패 |
| 504 | 타임아웃 |

---

## 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| GOOGLE_API_KEY | O | Google Custom Search API 키 |
| GOOGLE_CX | O | Custom Search Engine ID |
| AWS_ACCESS_KEY_ID | X | S3 업로드용 |
| AWS_SECRET_ACCESS_KEY | X | S3 업로드용 |
| AWS_S3_BUCKET | X | S3 버킷명 |
| AWS_S3_REGION | X | S3 리전 (기본: ap-northeast-2) |
| IMAGE_CACHE_SECONDS | X | 프록시 캐시 시간 (기본: 3600) |
