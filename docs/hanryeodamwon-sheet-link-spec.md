# 한려담원 시트 링크 매칭 명세

## 목적

`category=한려담원` 요청에서 시트의 `Campaign-Tagged URL`을 사용해 `metadata.url`을 보강한다.

기존 S3 `metadata.json`은 기본값으로 유지하고, 아래 조건을 모두 만족하는 경우에만 `url`을 덮어쓴다.

## 입력 파라미터

- `category`
  - 반드시 `한려담원`
- `keyword`
  - 시트의 `Detail` 과 비교할 키워드
- `dateCode`
  - `MMDD` 형식 문자열
  - 예: `0318`
- `blogName`
  - 블로그 이름 문자열
  - 예: `조각구름`

## 시트 기준

- 문서: `1QhF2EqaWfYGNWOeUYuPyBfiQ0aigfWop4Q13_jtm6qY`
- 탭: `블로그 UTM 변환기`
- 매칭 대상 열
  - `Medium = 날짜+블로그명`
  - `Detail = 키워드`
  - `Campaign-Tagged URL = 최종 링크`

## 정규화 규칙

모든 비교는 아래 정규화 후 수행한다.

- `trim`
- 모든 공백 제거
- `NFC` 정규화
- 소문자 변환

예시

- `dateCode=0318`, `blogName=조각 구름` -> `mediumKey = 0318조각구름`
- `keyword=홍성호 흑염소` -> `detailKey = 홍성호흑염소`

## 매칭 규칙

시트 한 행이 아래 두 조건을 모두 만족해야 유효하다.

- `normalize(row.Medium) === normalize(dateCode + blogName)`
- `normalize(row.Detail) === normalize(keyword)`

추가 필터

- `예시` 행 제외
- `Campaign-Tagged URL` 이 `http` 또는 `https` 로 시작해야 함
- `#REF!` 와 안내 문구는 제외

유효한 후보가 여러 개면 가장 아래쪽 행을 선택한다.

## 응답 규칙

- hit
  - `metadata.url = row.Campaign-Tagged URL`
  - `mapQueries`, `phone`, `lib_url` 는 기존 S3 metadata 유지
- miss
  - 기존 S3 metadata 그대로 유지

## 요청 예시

```text
/api/image/category-random?category=한려담원&keyword=홍성호%20흑염소&dateCode=0317&blogName=조각구름&count=1&subfolder=본문
```

```text
/api/image/product-images?category=한려담원&keyword=홍성호%20흑염소&dateCode=0317&blogName=조각구름
```

## 호출 측 가공 가이드

- `dateCode` 는 클라이언트에서 `MMDD` 문자열로 보내야 함
- `blogName` 은 사람이 읽는 이름 그대로 보내도 되지만, 서버에서 공백 제거 정규화를 수행함
- `keyword` 도 공백 포함 문자열 그대로 보내도 되지만, 서버에서 공백 제거 정규화를 수행함
- strict 매칭이므로 `dateCode`, `blogName`, `keyword` 중 하나라도 틀리면 URL 보강이 일어나지 않음
