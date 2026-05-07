# 이미지 입력 폴더 처리 및 S3 업로드

입력 폴더(애견, 안과 등)를 예시 형식에 맞게 처리하고 S3에 업로드하는 전체 프로세스입니다.

## 블로그 계정 매핑 테이블

```
패밀리넛 → ecjroe6558
빨간모자앤 - 준3 → dhtksk1p
정의 - 준4 → eqsdxv2863
찐찐찐찐찐이야 → ags2oigb
에스앤비안과 1 → mixxut
에스앤비안과 2 → ynattg
에스앤비안과 정보 → nahhjo
에스앤비안과, 28년 경력 → mzuul
에스앤비안과의원 → hagyga
모험 → geenl
탐험기 → ghhoy
얼음땡 - 준4 → cookie4931
투디치과 스킨블 → wound12567
토토리토 → precede1451
라우드 → loand3324
고구마스틱 → fail5644
룰루랄라 → compare14310
글로벌 → gmezz
운명의 마법사 → dyulp
맛집 탐험대 → lesyt
먹방 여행기 → aryunt
새로운 여행지 → zhuwl
은길 → enugii
떠나는날의 이야기 → nnhha
투데이 → aqahdp5252
해리포터 → selzze
불꽃 → bjwuo
새로운 발견 → ebbte
다이어리 → ganir
꿈꾸는 나날 → shcint
미식가 → yenalk
새로운 시작 → dyust
숙면구출 → momenft5251
고뇌물렁 → column13365
```

## 실행 프로세스

### 1단계: 입력 폴더 확인

```bash
ls -la _samples/input/{타입}_입력/
```

애견 프로세서는 로컬용과 NAS용을 분리해서 사용합니다.

```bash
로컬: pnpm -s process:pet:local
NAS:  pnpm -s process:pet:nas
```

기존 호환 명령어인 `pnpm -s process:pet` 는 로컬용과 동일하게 동작합니다.
애견 NAS 운영 경로는 `Daeyoon_NAS` 기준으로 아래를 사용합니다.

```bash
입력: /Volumes/21lab_데이터관리/0_자동발행/0_애견자동발행/애견_0507
출력: /Volumes/21lab_데이터관리/0_자동발행/0_애견자동발행/애견_0507_출력
```

`PET_INPUT_DIR`, `PET_OUTPUT_DIR` 로 실행 경로를 명시할 수 있습니다.
NAS 프로세서는 이미 출력 경로에 해당 블로그/키워드 결과물이 있으면 재처리하지 않고 기존 출력물을 재사용합니다.
NAS 결과를 강제로 다시 처리해야 할 때만 `PET_FORCE_REPROCESS=1 pnpm -s process:pet:nas` 를 실행합니다.

**입력 구조 (애견):**
```
애견_입력/
├── {블로그명}/
│   └── {키워드}/
│       ├── 라이브러리제외_1.jpg
│       ├── 라이브러리제외_2.gif
│       ├── 라이브러리제외_3.jpg
│       └── 지도,번호,링크.txt
```

**입력 구조 (안과):**
```
안과_입력/
├── {블로그폴더}_{blogId}/
│   └── {번호}.{키워드폴더}_{keyword}/
│       ├── 대표사진_1.png (본문)
│       ├── 라이브러리 제외사진_1.jpg (라이브러리제외)
│       ├── 제외사진_링크_1.jpg (라이브러리제외_링크)
│       └── 발행 전 필독 사항.txt
```

### 2단계: 예시 폴더 확인

```bash
ls -laR _samples/examples/{타입}예시/
```

예시 출력 구조를 참고하여 처리합니다.

### 3단계: 처리 스크립트 실행

**애견:**
```bash
npx tsx scripts/process-pet-input-folders.ts
```

**알리바바:**
```bash
npx tsx scripts/process-alibaba-input-folders.ts
```

**안과:**
```bash
npx tsx scripts/process-input-folders.ts
```

### 4단계: 출력 검토

```bash
# 키워드 매칭 확인
for blogId in "폴더1" "폴더2"; do
  echo "[$blogId]"
  echo "INPUT:"; ls "_samples/input/{타입}_입력/$blogId/"
  echo "OUTPUT:"; ls "_samples/output/{타입}_출력/$blogId/"
done

# 파일 수 검증
for d in _samples/output/{타입}_출력/*/*; do
  keyword=$(basename "$d")
  blogId=$(basename "$(dirname "$d")")
  imgCount=$(ls "$d/라이브러리제외/" 2>/dev/null | wc -l)
  hasMeta=$(test -f "$d/metadata.json" && echo "O" || echo "X")
  echo "[$blogId/$keyword] 이미지: ${imgCount}장, metadata: $hasMeta"
done
```

### 5단계: 키워드 카테고리 txt 생성

`_samples/output/{타입}_출력/키워드_카테고리.txt` 파일을 생성합니다.

**카테고리 종류 (애견):**
- 강아지품종
- 고양이품종
- 강아지분양정보
- 고양이분양정보

**카테고리 종류 (안과):**
- 스마일라식정보
- 라식라섹정보
- 렌즈삽입술정보
- 시력교정정보

**형식:**
```
{블로그명 또는 blogId}
{키워드}:{카테고리}
{키워드}:{카테고리}
...

{다음 블로그명}
...
```

- 키워드 순서는 계정별로 랜덤하게 셔플
- 같은 키워드라도 계정마다 다른 순서

### 6단계: S3 업로드

출력 검토에서 블로그/키워드 매핑, 이미지 수, `metadata.json`, 키워드 카테고리 txt 에 이상이 없으면 사용자에게 재확인하지 말고 바로 업로드합니다.

**블로그명 → 네이버 ID 매핑 사용:**

```bash
# 블로그명이 폴더명인 경우 (애견)
npx tsx scripts/upload-all-products.ts "./_samples/output/애견_출력/맛집 탐험대" lesyt

# blogId가 폴더명인 경우 (알리바바)
npx tsx scripts/upload-all-products.ts "./_samples/output/알리바바_출력/lesyt" lesyt

# blogId가 이미 폴더명인 경우 (안과)
npx tsx scripts/upload-all-products.ts "./_samples/output/안과_출력/mixxut" mixxut
```

**S3 경로:** `product-images/{네이버ID}/{키워드}/`

## 출력 구조

```
{타입}_출력/
├── {blogId 또는 블로그명}/
│   └── {키워드}/
│       ├── 본문/              # (안과만)
│       │   └── image_N.png
│       ├── 라이브러리제외/
│       │   └── 라이브러리제외_N.{ext}
│       ├── 라이브러리제외이미지/ # (알리바바만)
│       │   └── 라이브러리제외이미지_N.{ext}
│       ├── 라이브러리제외_링크/  # (안과만)
│       │   └── 라이브러리제외링크_N.{ext}
│       └── metadata.json
└── 키워드_카테고리.txt
```

**알리바바 출력 구조:**
```
알리바바_출력/
├── {blogId}/
│   └── {키워드}/
│       ├── 라이브러리제외이미지/
│       │   └── 라이브러리제외이미지_N.{ext}
│       └── metadata.json
```

## metadata.json 형식

```json
{
  "mapQueries": ["도그마루 논현", "도그마루 검단"],
  "phone": "1566-8713",
  "url": "https://example.com/",
  "lib_url": []
}
```

## 주의사항

1. S3 업로드 전 **반드시** 검토 단계를 거치고, 이상 없으면 바로 업로드함
2. 업로드 시 블로그명이 아닌 **네이버 ID** 사용
3. 입력 폴더 구조가 예시와 다르면 스크립트 수정 필요
4. 이미지 파일명이 규칙과 다르면 처리되지 않음
