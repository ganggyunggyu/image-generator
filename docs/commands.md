# 명령어 기록

## 프로젝트 스킬

- 애견/안과/알리바바 입력 처리 작업은 `.claude/commands/image-process.md` 를 기준 문서로 사용함
- 애견 입력은 `process:pet` -> `category:pet` -> `upload:blog` 순서로만 진행함
- 알리바바 입력은 `process:alibaba` 실행 후 `_samples/output/알리바바_출력/키워드_계정매칭.txt` 생성까지 확인한 뒤 `upload:blog` 로 진행함
- `process:pet` 와 `category:pet` 를 병렬 실행하면 빈 `키워드_카테고리.txt` 가 생길 수 있으니 순차 실행함

## 입력 폴더 확인

```bash
ls -la _samples/input/애견_입력/
ls -la _samples/input/안과_입력/
```

## 예시 폴더 확인

```bash
ls -laR _samples/examples/애견예시/
ls -laR _samples/examples/안과예시/
```

## 입력 -> 출력 처리

```bash
pnpm -s process:pet
pnpm -s process:alibaba
pnpm -s process:eye
```

## 출력 검토(선택)

```bash
# 파일 수 검증
for d in _samples/output/*_출력/*/*; do
  keyword=$(basename "$d")
  blogId=$(basename "$(dirname "$d")")
  imgCount=$(ls "$d/라이브러리제외/" 2>/dev/null | wc -l)
  hasMeta=$(test -f "$d/metadata.json" && echo "O" || echo "X")
  echo "[$blogId/$keyword] 이미지: ${imgCount}장, metadata: $hasMeta"
done
```

## 키워드 카테고리 txt 생성

```bash
pnpm -s category:pet
pnpm -s category:eye
```

## S3 업로드

### 애견: 블로그 1개만 업로드

```bash
pnpm -s upload:blog -- "./_samples/output/애견_출력/맛집 탐험대"
```

### 애견: 루트 폴더 업로드(안의 블로그 폴더 전부)

```bash
pnpm -s upload:blog -- "./_samples/output/애견_출력"
```

### 안과: 루트 폴더 업로드(안의 blogId 폴더 전부)

```bash
pnpm -s upload:blog -- "./_samples/output/안과_출력"
```

### 알리바바: 루트 폴더 업로드(안의 blogId 폴더 전부)

```bash
pnpm -s upload:blog -- "./_samples/output/알리바바_출력"
```

### 업로드 Dry-run / Verbose

```bash
pnpm -s upload:blog -- "./_samples/output/애견_출력" --dry-run
pnpm -s upload:blog -- "./_samples/output/애견_출력" --verbose
```

### 빠른 업로드(별칭)

```bash
pnpm -s upload:pet:all
pnpm -s upload:eye:all
```
