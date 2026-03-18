# Image API Specification

## 공통 응답 형식 (Image Serving APIs)

이미지를 반환하는 5개 API는 동일한 응답 구조를 사용한다.

### ProductImages Interface

```typescript
interface ProductImages {
  body: string[];
  individual: string[];
  slide: string[];
  collage: string[];
  excludeLibrary: string[];
  excludeLibraryLink: string[];
}
```

### 공통 응답 Body

```typescript
interface ImageResponse {
  images: ProductImages;
  metadata: Metadata;
  keyword: string;
  blogId: string;
  category: string;
  folder: string;
  total: number;
  failed: number;
  folderImageCount?: number;
}
```

### 이미지 반환 형식

| API | 이미지 형식 | 예시 |
|-----|------------|------|
| product-images | base64 data URI | `data:image/webp;base64,/9j/4AAQ...` |
| category-random | S3 URL | `https://{bucket}.s3.{region}.amazonaws.com/search-images/...` |
| ai-images | S3 URL | `https://{bucket}.s3.{region}.amazonaws.com/search-images/...` |
| random-frames | S3 URL (useS3=true) / base64 (useS3=false) | S3 URL or data URI |
| keyword-frames | S3 URL (useS3=true) / base64 (useS3=false) | S3 URL or data URI |

### Metadata Interface

```typescript
interface Metadata {
  mapQueries?: string[];
  phone?: string;
  url?: string;
  lib_url?: string[];
}
```

---

## 1. product-images

S3에 업로드된 상품별 이미지를 서빙. 사용 후 폴더 자동 소진.

```
GET /api/image/product-images
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keyword | string | Yes* | 상품 키워드 (S3 폴더명 매칭) |
| blogId | string | No | 블로그 ID (per-blog 이미지 풀) |
| category | string | Yes* | 카테고리명 (category-images/ 경로) |

\* `keyword` 또는 `category` 중 하나 필수

### S3 경로

- keyword 모드: `product-images/{blogId?}/{keyword}/본문/`, `개별/`, `슬라이드/`, ...
- category 모드: `category-images/{category}/본문/`, `개별/`, ...

### 이미지 처리

| 폴더 | ResponseKey | 왜곡 |
|------|-------------|------|
| 본문 | body | O (light) |
| 개별 | individual | O (light) |
| 슬라이드 | slide | O (light) |
| 콜라주 | collage | O (light) |
| 라이브러리제외 | excludeLibrary | X |
| 라이브러리제외_링크 | excludeLibraryLink | X |

### 이미지 반환 형식

`data:image/webp;base64,...` (base64 data URI)

### 특수 동작

- keyword 모드에서 이미지 리턴 성공 시 폴더 자동 rename: `{keyword}/ → _used_{keyword}/`
- `_used_` prefix 폴더는 매칭에서 제외

### Response 예시

```json
{
  "images": {
    "body": ["data:image/webp;base64,...", "data:image/webp;base64,..."],
    "individual": [],
    "slide": [],
    "collage": [],
    "excludeLibrary": ["data:image/webp;base64,..."],
    "excludeLibraryLink": []
  },
  "metadata": {
    "mapQueries": ["도그마루 부산"],
    "phone": "1566-8713",
    "url": "https://example.com"
  },
  "keyword": "말티즈",
  "blogId": "blog_abc",
  "category": "",
  "folder": "말티즈",
  "total": 7,
  "failed": 0
}
```

---

## 2. category-random

카테고리 이미지 중 랜덤 N장을 뽑아 왜곡 후 반환.

```
GET /api/image/category-random
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | string | Yes | - | 카테고리명 |
| count | number | No | 5 | 요청 이미지 수 (max: 20) |
| subfolder | string | No | 본문 | 하위 폴더명 |

### S3 경로

`category-images/{category}/{subfolder}/`

### 이미지 처리

- 전체 이미지 중 랜덤 셔플 후 count개 선택
- light distortion 적용
- 처리된 이미지를 S3에 업로드 (`search-images/category-processed/{category}/`)

### 이미지 반환 형식

S3 URL (`https://{bucket}.s3.{region}.amazonaws.com/search-images/category-processed/...`)

### Response 예시

```json
{
  "images": {
    "body": [
      "https://bucket.s3.ap-northeast-2.amazonaws.com/search-images/category-processed/한려담원/20250203_a1b2c3d4.webp",
      "https://bucket.s3.ap-northeast-2.amazonaws.com/search-images/category-processed/한려담원/20250203_e5f6g7h8.webp"
    ],
    "individual": [],
    "slide": [],
    "collage": [],
    "excludeLibrary": [],
    "excludeLibraryLink": []
  },
  "metadata": {},
  "keyword": "한려담원",
  "blogId": "",
  "category": "한려담원",
  "folder": "한려담원",
  "total": 5,
  "failed": 0
}
```

---

## 3. ai-images

S3 `images/` 폴더에서 키워드와 매칭되는 폴더의 이미지를 랜덤 반환.

```
GET /api/image/ai-images
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| keyword | string | Yes | - | 검색 키워드 |
| count | number | No | 5 | 요청 이미지 수 (max: 20) |
| distort | string | No | true | 왜곡 적용 여부 (`false`로 비활성화) |

### S3 경로

`images/{matchedFolder}/`

### 폴더 매칭 순서

1. 정확히 일치 (공백 제거 + lowercase)
2. 키워드가 폴더명에 포함
3. 폴더명이 키워드에 포함
4. 앞부분 부분 일치 (min 5글자)

### 이미지 처리

- 매칭 폴더 이미지가 50장 이상일 때만 응답 처리, 50장 미만이면 미매칭으로 간주
- 매칭 폴더 내 이미지 셔플 후 count개 선택
- `folderImageCount`: 매칭된 원본 폴더의 전체 이미지 수
- distort=true: light distortion 적용
- 처리된 이미지를 S3에 업로드 (`search-images/ai-processed/{keyword}/`)

### 이미지 반환 형식

S3 URL (`https://{bucket}.s3.{region}.amazonaws.com/search-images/ai-processed/...`)

### Response 예시

```json
{
  "images": {
    "body": [
      "https://bucket.s3.ap-northeast-2.amazonaws.com/search-images/ai-processed/강아지/20250203_a1b2c3d4.webp"
    ],
    "individual": [],
    "slide": [],
    "collage": [],
    "excludeLibrary": [],
    "excludeLibraryLink": []
  },
  "metadata": {},
  "keyword": "강아지",
  "blogId": "",
  "category": "",
  "folder": "강아지",
  "folderImageCount": 37,
  "total": 5,
  "failed": 0
}
```

---

## 4. random-frames

랜덤 키워드로 Google 이미지 검색 후 액자+필터+왜곡 적용.

```
POST /api/image/random-frames
```

### Request Body

```typescript
{
  count?: number;     // default: 5, max: 10
  category?: KeywordCategory;  // 키워드 카테고리 필터
}
```

### 이미지 처리

- Google 이미지 검색 (`count * 4`개 검색)
- 랜덤 액자 + 랜덤 필터 적용
- **heavy distortion** (비율왜곡 10-25%, 회전 ±8°, 뒤집기, 크롭 10-20%, 색상조정)
- S3 업로드 (useS3=true 시): `search-images/{keyword}/`

### 이미지 반환 형식

- S3 설정 O: S3 URL
- S3 설정 X: `data:image/png;base64,...`

### Response 예시

```json
{
  "images": {
    "body": ["https://bucket.s3.../search-images/puppy/20250203_abc.png"],
    "individual": [],
    "slide": [],
    "collage": [],
    "excludeLibrary": [],
    "excludeLibraryLink": []
  },
  "metadata": {},
  "keyword": "puppy",
  "blogId": "",
  "category": "",
  "folder": "puppy",
  "total": 5,
  "failed": 0
}
```

---

## 5. keyword-frames

지정 키워드로 Google 이미지 검색 후 액자+왜곡 적용. 부족 시 랜덤 키워드로 보충.

```
POST /api/image/keyword-frames
```

### Request Body

```typescript
{
  keyword: string;    // 필수
  count?: number;     // default: 5, max: 10
}
```

### 이미지 처리

- 한국어 키워드 → 영어 자동 번역 후 Google 검색
- 랜덤 액자 적용 (필터 없음)
- **light distortion** (밝기/채도 ±20%, hue ±12, 크롭 2-10%, 감마, 비율 ±3%)
- 결과 부족 시 랜덤 키워드로 나머지 보충
- S3 업로드 (useS3=true 시): `search-images/{keyword}/`

### 이미지 반환 형식

- S3 설정 O: S3 URL
- S3 설정 X: `data:image/png;base64,...`

### Response 예시

```json
{
  "images": {
    "body": ["https://bucket.s3.../search-images/강아지/20250203_abc.png"],
    "individual": [],
    "slide": [],
    "collage": [],
    "excludeLibrary": [],
    "excludeLibraryLink": []
  },
  "metadata": {},
  "keyword": "강아지",
  "blogId": "",
  "category": "",
  "folder": "강아지",
  "total": 5,
  "failed": 0
}
```

---

## 왜곡(Distortion) 파라미터 정리

### Light Distortion

| 파라미터 | 범위 | 설명 |
|---------|------|------|
| brightness | 0.80 ~ 1.20 | 밝기 |
| saturation | 0.80 ~ 1.20 | 채도 |
| hue | -12 ~ +12 | 색조 |
| cropPercent | 2% ~ 10% | 가장자리 크롭 |
| gamma | 1.0 ~ 1.3 | 감마 보정 |
| ratioX/Y | ±3% | 비율 미세 왜곡 |

### Heavy Distortion

| 파라미터 | 범위 | 설명 |
|---------|------|------|
| ratioX/Y | ±10-25% | 비율 왜곡 |
| rotation | -8° ~ +8° | 회전 |
| flip | 50% 확률 | 수평 뒤집기 |
| cropPercent | 10% ~ 20% | 가장자리 크롭 |
| brightness | 0.8 ~ 1.2 | 밝기 |
| saturation | 0.8 ~ 1.2 | 채도 |
| hue | -15 ~ +15 | 색조 |
| contrast | 0.9 ~ 1.1 | 대비 |
| gamma | 1.0 ~ 1.3 | 감마 |
| blur | 30% 확률, 0.5~1.0 | 블러 |
| sharpen | 30% 확률, sigma 0.5~1.5 | 샤프닝 |

---

## 유틸리티 APIs

### 6. proxy

외부 이미지를 WebP로 변환하여 프록시.

```
GET /api/image/proxy?src={encodedUrl}&w={width}&h={height}&q={quality}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| src | string | Yes | - | 원본 이미지 URL (URL 인코딩) |
| w | number | No | auto | 리사이즈 너비 (1-4000) |
| h | number | No | auto | 리사이즈 높이 (1-4000) |
| q | number | No | 92 | WebP 품질 (1-100) |

**Response**: `image/webp` 바이너리 (Cache-Control: 1시간)

---

### 7. search

Google 이미지 검색 결과 반환.

```
GET /api/image/search?q={query}&n={count}&sortOrder={order}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | 검색어 |
| n | number | No | 10 | 결과 수 |
| sortOrder | string | No | random | `original` or `random` |

**Response**:

```json
{
  "success": true,
  "data": {
    "query": "puppy",
    "results": [
      { "link": "https://example.com/image.jpg", "title": "..." }
    ],
    "totalResults": "1000000",
    "searchTime": 0.23,
    "timestamp": "2025-02-03T..."
  },
  "message": "10개의 이미지를 찾았습니다"
}
```

---

### 8. bulk-download

여러 이미지를 ZIP으로 일괄 다운로드. 선택적으로 액자/필터 적용.

```
POST /api/image/bulk-download
```

**Request Body**:

```typescript
{
  images: Array<{
    url: string;
    title: string;
    width?: number;
    height?: number;
    fallbackUrls?: string[];
  }>;
  effectOptions?: DownloadOptions;  // 액자/필터 옵션
  keyword?: string;                  // ZIP 파일명용
}
```

**Response**: `application/zip` 바이너리

---

### 9. bulk-download-processed

클라이언트에서 효과 적용된 이미지를 ZIP으로 일괄 다운로드. 대용량 body 지원 (200MB).

```
POST /api/image/bulk-download-processed
```

**Request Body** (streaming으로 파싱, 200MB 제한):

```typescript
{
  processedImages: Array<{
    url: string;
    title: string;
    width?: number;
    height?: number;
    imageUrl: string;
    processedDataUrl?: string;  // 효과 적용된 data URI
  }>;
  effectOptions: DownloadOptions;
  keyword?: string;
}
```

**Response**: `application/zip` 바이너리

---

### 10. product-metadata

상품 메타데이터만 조회 (이미지 없이).

```
GET /api/image/product-metadata?keyword={keyword}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keyword | string | No | 상품 키워드 (없으면 기본 폴더) |

**Response**:

```json
{
  "success": true,
  "metadata": {
    "mapQueries": ["도그마루 부산"],
    "phone": "1566-8713",
    "url": "https://example.com"
  },
  "keyword": "말티즈",
  "folder": "말티즈"
}
```

---

## S3 업로드 경로 정리

| API | 업로드 경로 | 설명 |
|-----|-----------|------|
| random-frames | `search-images/{keyword}/` | Google 검색 → 가공 이미지 |
| keyword-frames | `search-images/{keyword}/` | Google 검색 → 가공 이미지 |
| ai-images | `search-images/ai-processed/{keyword}/` | S3 원본 → 왜곡 이미지 |
| category-random | `search-images/category-processed/{category}/` | S3 원본 → 왜곡 이미지 |

파일명 형식: `{YYYYMMDD}_{uuid8자리}.{ext}`

---

## CORS

모든 API에 공통 적용:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 에러 응답 형식

### Image Serving APIs (1~5)

```json
{
  "error": "에러 메시지"
}
```

| HTTP Status | Description |
|-------------|-------------|
| 200 | 성공 (매칭 없으면 빈 배열) |
| 400 | 필수 파라미터 누락 |
| 404 | 검색 결과 없음 |
| 500 | 서버 오류 / S3 설정 오류 |

### Utility APIs (6~10)

```json
{
  "success": false,
  "error": "에러 메시지",
  "message": "English description"
}
```
