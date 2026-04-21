# Product Images API

## Endpoint

```
GET /api/image/product-images
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | Product keyword (matched to S3 folder) |
| `blogId` | string | No | Blog ID for per-blog image pool |
| `manuscriptType` | string | No | `alibaba` 면 알리바바 전용 본문 body 풀 사용 |

- `blogId` 있음 → `product-images/{blogId}/{keyword}/` 탐색
- `blogId` 없음 → `product-images/{keyword}/` 탐색

## Alibaba Body Override

`manuscriptType=alibaba` 이고 `blogId` 가 있을 때는 `images.body` 를 상품 폴더의 `본문/` 대신 로컬 `알리바바_본문` 풀에서 채운다.

- `weed3122`, `mad1651`, `chemical12568`, `1`, `2`, `3`, `알리바바1`, `알리바바2`, `알리바바3`, `qwzx16`
  → `_samples/알리바바_본문/알리바바1~3`
- `copy11525`, `individual14144`, `4`, `5`, `알리바바4`, `알리바바5`
  → `_samples/알리바바_본문/알리바바4~5`

동작 규칙:

1. 매칭된 본문 풀에서 5장을 랜덤 선택함
2. 각 이미지는 `applyLightDistortion` 을 적용해 base64 data URI로 반환함
3. `excludeLibrary`, `excludeLibraryLink`, metadata 는 기존 `product-images/{blogId}/{keyword}/...` 경로를 그대로 사용함
4. `total` 은 알리바바 body 5장과 기존 상품 이미지 수를 합산함
5. S3 상품 폴더 매칭이 없어도 알리바바 본문 풀 매칭만 되면 `images.body` 5장을 반환하고, 이 경우 `folder` 는 빈 문자열이며 library/metadata 는 비어 있음

## S3 Folder Structure

```
product-images/
├── {keyword}/                        ← blogId 없이 접근
│   ├── 본문/              → body
│   ├── 개별/              → individual
│   ├── 슬라이드/          → slide
│   ├── 콜라주/            → collage
│   ├── 라이브러리제외/     → excludeLibrary
│   ├── 라이브러리제외이미지/ → excludeLibrary
│   ├── 라이브러리제외_링크/ → excludeLibraryLink
│   └── metadata.json
└── {blogId}/                         ← blogId로 접근
    ├── {keyword}/
    │   ├── 본문/
    │   ├── 라이브러리제외/
    │   └── metadata.json
    └── _used_{keyword}/              ← 사용 완료 (자동 rename)
```

## Keyword Matching

1. **exact match** — 공백 제거 + 소문자 변환 후 정확히 일치
2. **suffix match** — `_N` suffix 제거 후 일치 (`강아지무료분양_1` → `강아지무료분양`)
3. **contains match** — 키워드가 폴더명(또는 base)을 포함 (longest match first)

## Auto-rename (사용 후 비활성화)

이미지 리턴 성공 시 해당 폴더가 자동으로 rename:
```
product-images/{blogId}/{keyword}/ → product-images/{blogId}/_used_{keyword}/
```
- `_used_` prefix가 붙은 폴더는 매칭에서 자동 제외
- 중복 키워드(`강아지무료분양_1`, `_2`)는 순차 소진

## Response Type

```typescript
interface ProductImages {
  body: string[];               // base64, distorted
  individual: string[];         // base64, distorted
  slide: string[];              // base64, distorted
  collage: string[];            // base64, distorted
  excludeLibrary: string[];     // base64, no distortion
  excludeLibraryLink: string[]; // base64, no distortion
}

interface Metadata {
  mapQueries?: string[];  // map search queries
  phone?: string;         // phone number
  url?: string;           // website URL
  lib_url?: string[];     // URLs paired with excludeLibraryLink images (1:1)
}

interface ProductImagesResponse {
  images: ProductImages;
  metadata: Metadata;
  keyword: string;
  blogId: string;
  folder: string;
  total: number;
  failed: number;
}
```

## Request / Response Examples

### blogId 없이 (기존 방식)

```
GET /api/image/product-images?keyword=말티즈
```

S3 탐색 경로: `product-images/말티즈/`

### blogId 포함

```
GET /api/image/product-images?keyword=말티즈&blogId=blog_abc
```

S3 탐색 경로: `product-images/blog_abc/말티즈/`

### Response

```json
{
  "images": {
    "body": ["data:image/webp;base64,..."],
    "individual": [],
    "slide": [],
    "collage": [],
    "excludeLibrary": ["data:image/webp;base64,..."],
    "excludeLibraryLink": []
  },
  "metadata": {
    "mapQueries": ["도그마루 부산", "도그마루 논현"],
    "phone": "1566-8713",
    "url": "https://dmanimal.co.kr/",
    "lib_url": []
  },
  "keyword": "말티즈",
  "blogId": "blog_abc",
  "folder": "말티즈",
  "total": 7,
  "failed": 0
}
```

## Image Distortion Rules

| Response Key | S3 Folder | Distortion |
|-------------|-----------|------------|
| `body` | 본문 | Yes |
| `individual` | 개별 | Yes |
| `slide` | 슬라이드 | Yes |
| `collage` | 콜라주 | Yes |
| `excludeLibrary` | 라이브러리제외 | No |
| `excludeLibrary` | 라이브러리제외이미지 | No |
| `excludeLibraryLink` | 라이브러리제외_링크 | No |

Distortion params: brightness(0.85~1.15), saturation(0.85~1.15), hue(-8~+8), crop(1~7%)

## excludeLibraryLink + lib_url Pairing

`excludeLibraryLink` images and `metadata.lib_url` are paired 1:1 by index.

```typescript
const { images, metadata } = response;

images.excludeLibraryLink.forEach((base64, index) => {
  const linkUrl = metadata.lib_url?.[index] || '';
});
```

## Upload Script

```bash
# 애견: blog folder(블로그명) + blogId
npx tsx scripts/upload-all-products.ts "./_samples/output/애견_출력/맛집 탐험대" lesyt

# 애견: blogId 생략 가능 (scripts/lib/blog-account-map.ts 매핑 기반)
npx tsx scripts/upload-all-products.ts "./_samples/output/애견_출력/맛집 탐험대"

# 애견: 루트 폴더 업로드 (안에 있는 블로그 폴더 전부 업로드)
npx tsx scripts/upload-all-products.ts "./_samples/output/애견_출력"

# 안과: 폴더명이 이미 blogId인 케이스
npx tsx scripts/upload-all-products.ts "./_samples/output/안과_출력/mixxut"

# 안과: 루트 폴더 업로드 (안에 있는 blogId 폴더 전부 업로드)
npx tsx scripts/upload-all-products.ts "./_samples/output/안과_출력"
```

## Error

| HTTP Status | Description |
|-------------|-------------|
| 200 | Success (empty arrays if no match) |
| 500 | S3 config error or server error |

## CORS

All origins allowed (`Access-Control-Allow-Origin: *`)
