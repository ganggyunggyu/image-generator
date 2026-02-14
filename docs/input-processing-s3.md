# 입력 폴더 처리 + S3 업로드 프로세스

네트워크 제한 환경에서 `npx tsx` 실행이 막힐 수 있어서, 이 레포는 `pnpm` + `tsc`로 스크립트를 빌드 후 `node dist-scripts/...`로 실행하는 방식을 기본으로 둠.

## 1) 입력 폴더 확인

```bash
ls -la _samples/input/애견_입력/
ls -la _samples/input/안과_입력/
```

## 2) 예시 폴더 확인

```bash
ls -laR _samples/examples/애견예시/
ls -laR _samples/examples/안과예시/
```

## 3) 처리 스크립트 실행

```bash
pnpm -s process:pet
pnpm -s process:eye
```

출력 위치는 아래와 같음.

- `_samples/output/애견_출력/{블로그명}/{키워드}/...`
- `_samples/output/안과_출력/{blogId}/{키워드}/...`

## 4) 출력 검토

```bash
# 키워드 매칭 확인
for blogId in "폴더1" "폴더2"; do
  echo "[$blogId]"
  echo "INPUT:"; ls "_samples/input/{타입}_입력/$blogId/" || true
  echo "OUTPUT:"; ls "_samples/output/{타입}_출력/$blogId/" || true
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

## 5) 키워드 카테고리 txt 생성

```bash
pnpm -s category:pet
pnpm -s category:eye
```

생성 파일:

- `_samples/output/애견_출력/키워드_카테고리.txt`
- `_samples/output/안과_출력/키워드_카테고리.txt`

## 6) S3 업로드 (검토 후)

`scripts/lib/blog-account-map.ts`에 블로그명 -> 네이버 ID 매핑이 들어있음.

```bash
# 애견: 블로그 폴더(블로그명) 업로드 (blogId 자동 추론됨)
pnpm -s upload:blog -- "./_samples/output/애견_출력/맛집 탐험대"

# 애견: 루트 폴더 업로드 (안에 있는 블로그 폴더 전부 업로드, 계정 매칭 자동)
pnpm -s upload:blog -- "./_samples/output/애견_출력"

# 안과: 폴더명이 blogId인 케이스 (blogId 자동 추론됨)
pnpm -s upload:blog -- "./_samples/output/안과_출력/mixxut"

# 안과: 루트 폴더 업로드 (안에 있는 blogId 폴더 전부 업로드)
pnpm -s upload:blog -- "./_samples/output/안과_출력"
```
