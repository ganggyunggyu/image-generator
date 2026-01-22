# Random Image API

키워드 기반 이미지 검색 → 랜덤 액자/필터 적용 → S3 업로드 → URL 리턴

## Endpoint

```
POST /api/image/random-frames
```

## Request

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

## Response

```json
{
  "images": [
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260122_abc12345.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260122_def67890.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260122_ghi13579.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260122_jkl24680.webp" },
    { "url": "https://21lab-images.s3.ap-northeast-2.amazonaws.com/search-images/강아지/20260122_mno98765.webp" }
  ],
  "total": 5,
  "failed": 0
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| images | `List[ImageItem]` | 생성된 이미지 URL 배열 |
| images[].url | string | 이미지 URL (S3) |
| total | int | 성공한 이미지 개수 |
| failed | int | 실패한 이미지 개수 |

## S3 URL 구조

```
https://{BUCKET}.s3.{REGION}.amazonaws.com/search-images/{keyword}/{YYYYMMDD}_{uuid8}.webp
```

## 랜덤 선택 규칙

- **액자**: classic, modern, gold, wood, vintage 중 랜덤 (none 제외)
- **필터**: none, grayscale, sepia, vintage, warm, cool, dramatic 중 랜덤

## 에러 응답

| 상태 코드 | 설명 |
|-----------|------|
| 400 | keyword 누락 |
| 404 | 검색 결과 없음 |
| 500 | 서버 오류 |

```json
{
  "error": "에러 메시지"
}
```

## 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| GOOGLE_API_KEY | O | Google Custom Search API 키 |
| GOOGLE_CSE_ID | O | Custom Search Engine ID |
| AWS_ACCESS_KEY_ID | O | S3 업로드용 |
| AWS_SECRET_ACCESS_KEY | O | S3 업로드용 |
| AWS_S3_BUCKET | O | S3 버킷명 |
| AWS_S3_REGION | X | S3 리전 (기본: ap-northeast-2) |
