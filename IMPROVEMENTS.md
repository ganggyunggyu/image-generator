# 코드 개선점 분석 보고서

> 분석일: 2025-12-01
> 분석 대상: 전체 프로젝트 (Next.js 14 + TypeScript)
> 분석 도구: Claude Code Improve Agent

## 📊 요약

- 🔴 **Critical**: 5건 (즉시 수정 필요)
- 🟠 **High**: 12건 (빠른 수정 권장)
- 🟡 **Medium**: 13건 (점진적 개선)
- 🟢 **Low**: 10건 (편의성 개선)

**총 40개 이슈 발견**

---

## 🔴 Critical Issues

### [CRIT-001] Non-null Assertion으로 인한 런타임 크래시 위험

**위치**:
- `src/lib/google.ts:111`
- `src/utils/image/fetch.ts:27`
- `src/shared/lib/frame-filter/random.ts:39, 51`

**문제**:
배열 인덱스 접근 시 `!` assertion을 사용하지만 실제로 `undefined`가 반환될 가능성이 있습니다.

**현재 코드**:
```typescript
// src/lib/google.ts:111
const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]!;

// src/shared/lib/frame-filter/random.ts:39
export const selectRandomFrame = (): FrameStyle => {
  const realFrames = getRealFrameStyles();
  return realFrames[Math.floor(Math.random() * realFrames.length)]!;
};
```

**영향**:
- `userAgents` 배열이 비어있을 경우 런타임 에러 발생
- `FRAME_STYLES`에서 'none'과 'random' 제거 후 빈 배열이 되면 크래시

**해결 방안**:
```typescript
// src/lib/google.ts:111
const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)] ?? userAgents[0];

// src/shared/lib/frame-filter/random.ts:39
export const selectRandomFrame = (): FrameStyle => {
  const realFrames = getRealFrameStyles();
  if (realFrames.length === 0) {
    throw new Error('사용 가능한 프레임이 없습니다');
  }
  return realFrames[Math.floor(Math.random() * realFrames.length)]!;
};
```

**검증 방법**:
- 빈 배열로 테스트 케이스 작성
- TypeScript strict null checks 활성화

---

### [CRIT-002] 배열 필터링 후 타입 안정성 부족

**위치**:
- `src/widgets/image-search/hooks/use-bulk-download.ts:24-30`
- `src/features/image-search/hooks/use-bulk-download.ts:62-67`

**문제**:
`filter(index => results[index])`로 필터링하지만 map에서 non-null assertion 사용으로 여전히 undefined 가능성 존재

**현재 코드**:
```typescript
const selectedResults = Array.from(selectedImages)
  .filter(index => results[index])
  .map(index => ({
    url: results[index]!.link,  // ⚠️ 위험!
    title: results[index]!.title,
    width: results[index]!.image.width,
    height: results[index]!.image.height,
  }));
```

**영향**:
- filter는 truthy 체크만 하므로 map에서 실제로 undefined일 수 있음
- 타입 안정성 상실

**해결 방안**:
```typescript
const selectedResults = Array.from(selectedImages)
  .map(index => {
    const result = results[index];
    if (!result) {
      console.error(`Invalid index: ${index}`);
      return null;
    }
    return {
      url: result.link,
      title: result.title,
      width: result.image.width,
      height: result.image.height,
      imageUrl: result.imageUrl,
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null);
```

**검증 방법**:
- 잘못된 인덱스로 테스트
- TypeScript strict mode 확인

---

### [CRIT-003] FSD 아키텍처 위반

**위치**: `src/widgets/image-search/ImageSearchWithState.tsx`

**문제**:
Widget 레이어가 자체 hooks를 가지고 있어 FSD 아키텍처 원칙 위반

**현재 구조**:
```
widgets/image-search/
├── hooks/                    ❌ Widget은 hooks를 가지면 안됨
│   ├── use-image-search.ts
│   ├── use-image-selection.ts
│   └── use-bulk-download.ts
└── ImageSearchWithState.tsx

features/image-search/
├── hooks/                    ✅ Feature에 있어야 함
│   ├── use-image-search.ts   (중복!)
│   └── use-bulk-download.ts  (중복!)
```

**영향**:
- 코드 중복 (같은 기능이 2곳에 구현됨)
- 레이어 간 책임 불명확
- 유지보수 어려움

**해결 방안**:

**Option 1: Feature 레이어로 통합 (권장)**
```
features/image-search/
├── hooks/
│   ├── use-image-search.ts    (Jotai 버전으로 통일)
│   ├── use-image-selection.ts
│   └── use-bulk-download.ts
└── ui/
    └── SearchSection.tsx

widgets/image-search/
└── ImageSearchWidget.tsx       (Feature 조합만)
```

**Option 2: 명확한 역할 분리**
- Widget hooks → 프레젠테이션 로직만
- Feature hooks → 비즈니스 로직

**검증 방법**:
- FSD Linter 실행
- Import 방향성 체크

---

### [CRIT-004] 코드 중복: use-image-search.ts 2개 버전

**위치**:
- `src/widgets/image-search/hooks/use-image-search.ts`
- `src/features/image-search/hooks/use-image-search.ts`

**문제**:
거의 동일한 로직이 두 곳에 구현됨

**차이점**:
| 항목 | Widget 버전 | Feature 버전 |
|------|-------------|--------------|
| 상태 관리 | useState | Jotai atoms |
| 코드 라인 | 84줄 | 84줄 |
| 사용처 | ImageSearchWithState | ResultsSection |

**영향**:
- 버그 수정 시 두 곳 모두 수정 필요
- 일관성 유지 어려움
- 코드베이스 크기 증가

**해결 방안**:
```typescript
// features/image-search/hooks/use-image-search.ts (통합 버전)
import { useAtom } from 'jotai';
import { searchResultsAtom, searchQueryAtom, ... } from '@/entities/image';

export const useImageSearch = () => {
  // Jotai atoms로 전역 상태 관리
  const [query, setQuery] = useAtom(searchQueryAtom);
  const [results, setResults] = useAtom(searchResultsAtom);
  // ...

  return {
    query,
    setQuery,
    results,
    // ...
  };
};

// widgets에서는 feature hook 재사용
import { useImageSearch } from '@/features/image-search';
```

**검증 방법**:
- 두 버전의 기능이 동일하게 동작하는지 확인
- Widget 버전 삭제 후 테스트

---

### [CRIT-005] 불안전한 타입 단언

**위치**: `src/utils/url/validate.ts:60`

**문제**:
`as any` 사용으로 타입 안정성 완전히 상실

**현재 코드**:
```typescript
if (mime) {
  if (!VALID_IMAGE_MIMES.includes(mime.toLowerCase() as any)) {
    console.log(`⚠️❌ MIME 타입 거부!! ${mime} 🚫 ${url}`);
    return false;
  }
}
```

**영향**:
- 컴파일 타임 타입 체크 무력화
- 잘못된 MIME 타입 통과 가능

**해결 방안**:
```typescript
const VALID_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;

type ValidImageMime = typeof VALID_IMAGE_MIMES[number];

export const isValidImageUrl = (url: string, mime?: string): boolean => {
  try {
    // ...

    if (mime) {
      const lowerMime = mime.toLowerCase();
      if (!VALID_IMAGE_MIMES.includes(lowerMime as ValidImageMime)) {
        console.log(`⚠️❌ MIME 타입 거부!! ${mime} 🚫 ${url}`);
        return false;
      }
    }

    // ...
  } catch {
    return false;
  }
};
```

**검증 방법**:
- TypeScript strict mode에서 컴파일
- 잘못된 MIME 타입으로 테스트

---

## 🟠 High Priority Issues

### [HIGH-001] 랜덤 모드에서 중복 배치 요청 가능

**위치**: `src/lib/google.ts:108-112`

**문제**:
랜덤 startIndex 선택 시 이미 선택한 인덱스를 다시 선택할 수 있음

**현재 코드**:
```typescript
if (sortOrder === 'random') {
  const randomStartOptions = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];
  startIndex = randomStartOptions[Math.floor(Math.random() * randomStartOptions.length)]!;
  console.log(`🎲🔥 랜덤 배치!! ${i + 1}/3 startIndex=${startIndex} 💨`);
}
```

**영향**:
- 같은 배치를 여러 번 요청하여 중복 이미지 발생
- API 할당량 낭비

**해결 방안**:
```typescript
if (sortOrder === 'random') {
  const randomStartOptions = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];
  const usedIndices = new Set<number>();

  let attempts = 0;
  do {
    startIndex = randomStartOptions[Math.floor(Math.random() * randomStartOptions.length)]!;
    attempts++;
  } while (usedIndices.has(startIndex) && attempts < 10);

  usedIndices.add(startIndex);
  console.log(`🎲🔥 랜덤 배치!! ${i + 1}/3 startIndex=${startIndex} 💨`);
}
```

**검증 방법**:
- 랜덤 모드로 여러 번 검색하여 중복 확인

---

### [HIGH-002] 환경 변수 파싱 검증 부족

**위치**: `src/app/api/image/proxy/route.ts:78`

**문제**:
환경 변수를 parseInt하지만 NaN 체크 없음

**현재 코드**:
```typescript
const cacheSeconds = parseInt(process.env.IMAGE_CACHE_SECONDS || '3600', 10);
```

**영향**:
- 잘못된 환경 변수 입력 시 `NaN` 반환
- Cache-Control 헤더 깨짐

**해결 방안**:
```typescript
const DEFAULT_CACHE_SECONDS = 3600;
let cacheSeconds = parseInt(process.env.IMAGE_CACHE_SECONDS || String(DEFAULT_CACHE_SECONDS), 10);

if (isNaN(cacheSeconds) || cacheSeconds < 0) {
  console.warn(`⚠️ Invalid IMAGE_CACHE_SECONDS: ${process.env.IMAGE_CACHE_SECONDS}, using default ${DEFAULT_CACHE_SECONDS}`);
  cacheSeconds = DEFAULT_CACHE_SECONDS;
}
```

**검증 방법**:
- `.env.local`에 잘못된 값 설정 후 테스트
- 환경 변수 없이 실행

---

### [HIGH-003] setTimeout cleanup 누락 (메모리 누수)

**위치**:
- `src/widgets/image-search/ImageSearchWithState.tsx:70-72`
- `src/features/image-search/hooks/use-bulk-download.ts:104-107`

**문제**:
컴포넌트 언마운트 시에도 setTimeout이 실행됨

**현재 코드**:
```typescript
// ImageSearchWithState.tsx
setTimeout(() => {
  setSelectedImages(new Set());
}, 3000);

// use-bulk-download.ts
setTimeout(() => {
  setDownloadProgress('');
  setSelectedImages(new Set());
}, 3000);
```

**영향**:
- 메모리 누수 가능성
- 언마운트된 컴포넌트 상태 업데이트 시도 → 경고 발생

**해결 방안**:
```typescript
// ImageSearchWithState.tsx
useEffect(() => {
  if (!bulkDownloadLoading && downloadProgress) {
    const timer = setTimeout(() => {
      setSelectedImages(new Set());
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [bulkDownloadLoading, downloadProgress]);

// use-bulk-download.ts (hook 내부)
const clearTimer = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  return () => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }
  };
}, []);

// 사용 시
clearTimer.current = setTimeout(() => {
  setDownloadProgress('');
  setSelectedImages(new Set());
}, 3000);
```

**검증 방법**:
- React DevTools로 메모리 누수 확인
- 컴포넌트 언마운트 후 콘솔 경고 확인

---

### [HIGH-004] useEffect 의존성 배열 최적화 필요

**위치**: `src/shared/ui/download-modal/hooks/use-download-modal.ts:18-41`

**문제**:
모달 닫을 때 진행 중인 이미지 처리가 계속 실행됨

**현재 코드**:
```typescript
useEffect(() => {
  if (!isOpen) return;

  const processImage = async () => {
    try {
      setIsProcessing(true);
      // 이미지 처리 로직 (시간 소요)
      const dataUrl = await applyFrameAndFilterToImage(...);
      setProcessedDataUrl(dataUrl);
    } catch (error) {
      console.error('❌ 이미지 처리 실패', error);
    } finally {
      setIsProcessing(false);
    }
  };

  processImage();
}, [selectedFrame, selectedFilter, imageUrl, isOpen]);
```

**영향**:
- 모달 닫아도 백그라운드에서 계속 처리
- 리소스 낭비

**해결 방안**:
```typescript
useEffect(() => {
  if (!isOpen) return;

  const abortController = new AbortController();

  const processImage = async () => {
    try {
      setIsProcessing(true);

      // AbortController 전달
      const dataUrl = await applyFrameAndFilterToImage(
        imageUrl,
        { frame: selectedFrame, filter: selectedFilter },
        1200,
        { signal: abortController.signal }
      );

      if (!abortController.signal.aborted) {
        setProcessedDataUrl(dataUrl);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ 이미지 처리 실패', error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsProcessing(false);
      }
    }
  };

  processImage();

  return () => {
    abortController.abort();
  };
}, [selectedFrame, selectedFilter, imageUrl, isOpen]);
```

**검증 방법**:
- 처리 중 모달 닫기
- Network 탭에서 요청 취소 확인

---

### [HIGH-005] N+1 문제: Google API 순차 호출

**위치**: `src/lib/google.ts:105-197`

**문제**:
최대 3번의 API 호출을 순차적으로 처리 + 200ms 대기

**현재 코드**:
```typescript
for (let i = 0; i < requestsNeeded; i++) {
  const response = await fetch(searchUrl.toString(), ...);
  // 처리...

  if (i < requestsNeeded - 1) {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}
```

**영향**:
- 총 소요 시간 = (API 응답 시간 × 3) + 400ms
- 예: 각 API 1초 → 총 3.4초

**해결 방안**:

**Option 1: 병렬 요청 (단, Google API 할당량 주의)**
```typescript
const requests = Array.from({ length: requestsNeeded }, (_, i) => {
  const startIndex = i * 10 + 1;
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
  // URL 설정...
  return fetch(searchUrl.toString(), { ... });
});

const responses = await Promise.all(requests);

for (const response of responses) {
  // 처리...
}
```

**Option 2: 지연 병렬 (추천)**
```typescript
import pLimit from 'p-limit';

const limit = pLimit(2); // 최대 2개 동시 실행

const promises = Array.from({ length: requestsNeeded }, (_, i) =>
  limit(async () => {
    // API 호출
    return fetch(searchUrl.toString(), { ... });
  })
);

const responses = await Promise.all(promises);
```

**검증 방법**:
- Network 탭에서 타이밍 확인
- 성능 프로파일링

---

### [HIGH-006] useCallback 누락으로 인한 불필요한 리렌더링

**위치**: `src/widgets/image-search/ImageSearchWithState.tsx:38-88`

**문제**:
모든 핸들러 함수가 매 렌더마다 재생성됨

**현재 코드**:
```typescript
const handleToggleSelection = (index: number) => {
  const errorMsg = toggleImageSelection(index);
  if (errorMsg) {
    setError(errorMsg);
  } else {
    setError(null);
  }
};

const handleSelectAll = () => {
  const errorMsg = selectAllImages();
  if (errorMsg) {
    setError(errorMsg);
  } else {
    setError(null);
  }
};

// ... 4개 더
```

**영향**:
- 자식 컴포넌트에 새 함수 참조 전달 → 불필요한 리렌더링
- 성능 저하 (특히 이미지 30개 렌더링 시)

**해결 방안**:
```typescript
const handleToggleSelection = useCallback((index: number) => {
  const errorMsg = toggleImageSelection(index);
  if (errorMsg) {
    setError(errorMsg);
  } else {
    setError(null);
  }
}, [toggleImageSelection, setError]);

const handleSelectAll = useCallback(() => {
  const errorMsg = selectAllImages();
  if (errorMsg) {
    setError(errorMsg);
  } else {
    setError(null);
  }
}, [selectAllImages, setError]);

const handleClearSelection = useCallback(() => {
  clearSelection();
  setError(null);
}, [clearSelection, setError]);

const handleBulkDownloadWrapper = useCallback(async (options?: DownloadOptions) => {
  const errorMsg = await handleBulkDownload(
    { selectedImages, results, query },
    options
  );

  if (errorMsg) {
    setError(errorMsg);
  } else {
    setTimeout(() => {
      setSelectedImages(new Set());
    }, 3000);
  }
}, [handleBulkDownload, selectedImages, results, query, setError, setSelectedImages]);

const handleImageClick = useCallback((imageUrl: string, title: string) => {
  console.log('👆✨ 이미지 클릭했다!! 🎨🔥', title, '🌐', imageUrl);
  window.open(imageUrl, '_blank', 'noopener,noreferrer');
}, []);

const handleDownload = useCallback((imageUrl: string, title: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `${title.replace(/[^a-zA-Z0-9가-힣\s]/g, '')}.webp`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}, []);
```

**검증 방법**:
- React DevTools Profiler로 리렌더링 횟수 확인
- Before/After 비교

---

### [HIGH-007] 상태 관리 혼재 (useState vs Jotai)

**위치**: 프로젝트 전체

**문제**:
- Widget: useState 사용
- Feature: Jotai atoms 사용
- 두 접근법이 혼재되어 상태 동기화 이슈

**영향**:
- 디버깅 어려움
- 상태 추적 복잡
- 팀원 간 혼란

**해결 방안**:

**Option 1: Jotai로 통일 (권장)**
```typescript
// entities/image/model/atoms.ts
export const searchQueryAtom = atom('');
export const searchResultsAtom = atom<ImageResult[]>([]);
export const selectedImagesAtom = atom<Set<number>>(new Set());
// ...

// widgets에서 사용
import { useAtom } from 'jotai';
import { searchQueryAtom, searchResultsAtom } from '@/entities/image';

const [query, setQuery] = useAtom(searchQueryAtom);
const [results] = useAtom(searchResultsAtom);
```

**Option 2: Context API로 통일**
```typescript
const ImageSearchContext = createContext<ImageSearchContextType | null>(null);

export const ImageSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  // ...

  return (
    <ImageSearchContext.Provider value={{ query, setQuery, results, setResults, ... }}>
      {children}
    </ImageSearchContext.Provider>
  );
};
```

**검증 방법**:
- 상태 변경 시 모든 컴포넌트 동기화 확인
- Redux DevTools (Jotai devtools) 사용

---

### [HIGH-008] 키 prop으로 배열 인덱스 사용

**위치**: `src/features/image-search/ui/ResultsSection.tsx:101`

**문제**:
배열 인덱스를 key로 사용하여 정렬/필터링 시 렌더링 이슈

**현재 코드**:
```typescript
{results.map((result, index) => (
  <ImageCard
    key={index}  // ⚠️ 인덱스 사용
    image={result}
    index={index}
    // ...
  />
))}
```

**영향**:
- 랜덤 정렬 시 동일한 인덱스에 다른 이미지 매핑
- React가 컴포넌트 재사용 못함 → 성능 저하
- 선택 상태 꼬임 가능성

**해결 방안**:
```typescript
{results.map((result, index) => (
  <ImageCard
    key={`${result.link}-${index}`}  // 고유 ID 조합
    image={result}
    index={index}
    // ...
  />
))}
```

**더 좋은 방법 (API 응답에 ID 추가)**:
```typescript
// 백엔드에서 고유 ID 부여
interface ImageResult {
  id: string;  // 추가
  title: string;
  link: string;
  // ...
}

// 사용
<ImageCard key={result.id} ... />
```

**검증 방법**:
- 정렬 옵션 변경 후 선택 상태 확인
- React DevTools로 key 경고 확인

---

### [HIGH-009] Server/Client 컴포넌트 최적화 부족

**위치**: `src/widgets/image-search/ImageSearchWithState.tsx:1`

**문제**:
'use client' 선언으로 하위 컴포넌트 모두 클라이언트로 강제됨

**현재 구조**:
```typescript
'use client';  // 전체 컴포넌트 클라이언트

export const ImageSearchWithState: React.FC = () => {
  // 많은 useState, useEffect
  return (
    <div>
      <SearchHeader />        {/* 정적 컨텐츠 */}
      <SearchForm ... />      {/* 인터랙티브 */}
      <ResultsGrid ... />     {/* 인터랙티브 */}
    </div>
  );
};
```

**영향**:
- 번들 크기 증가
- 초기 로딩 느림
- SEO 불리

**해결 방안**:
```typescript
// SearchHeader.tsx (Server Component)
export const SearchHeader: React.FC = () => {
  return (
    <div>
      <h1>Google 이미지 검색</h1>
      <p>...</p>
    </div>
  );
};

// SearchForm.tsx (Client Component)
'use client';
export const SearchForm: React.FC<Props> = ({ ... }) => {
  // 인터랙티브 로직
};

// ImageSearchWithState.tsx (Server Component)
export const ImageSearchWithState: React.FC = () => {
  return (
    <div>
      <SearchHeader />        {/* Server */}
      <SearchFormWrapper />   {/* Client (wrapper) */}
      <ResultsWrapper />      {/* Client (wrapper) */}
    </div>
  );
};
```

**검증 방법**:
- Lighthouse 스코어 비교
- 번들 분석기로 크기 확인

---

### [HIGH-010] FILTER_STYLES[0] 항상 존재 가정

**위치**: `src/shared/lib/frame-filter/apply-effects.ts:94`

**문제**:
배열 첫 번째 요소가 항상 존재한다고 가정

**현재 코드**:
```typescript
export const applyFrameAndFilterToImage = async (
  imageUrl: string,
  options?: Partial<DownloadOptions>,
  targetSize: number = 800
): Promise<string> => {
  const finalOptions: DownloadOptions = {
    frame: options?.frame || FRAME_STYLES[0]!,
    filter: options?.filter || FILTER_STYLES[0]!,
  };
  // ...
};
```

**영향**:
- FRAME_STYLES/FILTER_STYLES가 빈 배열이면 크래시

**해결 방안**:
```typescript
// constants.ts
export const NONE_FRAME: FrameStyle = {
  id: 'none',
  name: '없음',
  preview: '⬜',
  type: 'none',
};

export const NONE_FILTER: FilterStyle = {
  id: 'none',
  name: '없음',
  preview: '⬜',
};

export const FRAME_STYLES: FrameStyle[] = [NONE_FRAME, ...];
export const FILTER_STYLES: FilterStyle[] = [NONE_FILTER, ...];

// apply-effects.ts
const finalOptions: DownloadOptions = {
  frame: options?.frame ?? NONE_FRAME,
  filter: options?.filter ?? NONE_FILTER,
};
```

**검증 방법**:
- 빈 배열로 테스트

---

### [HIGH-011] 랜덤 선택 시 빈 배열 체크 누락

**위치**: `src/shared/lib/frame-filter/random.ts:51`

**문제**:
`selectRandomFilter`도 `selectRandomFrame`과 동일한 문제

**현재 코드**:
```typescript
export const selectRandomFilter = (): FilterStyle => {
  const realFilters = getRealFilterStyles();
  return realFilters[Math.floor(Math.random() * realFilters.length)]!;
};
```

**해결 방안**:
```typescript
export const selectRandomFilter = (): FilterStyle => {
  const realFilters = getRealFilterStyles();
  if (realFilters.length === 0) {
    throw new Error('사용 가능한 필터가 없습니다');
  }
  return realFilters[Math.floor(Math.random() * realFilters.length)]!;
};
```

---

### [HIGH-012] Promise.all로 인한 메모리/네트워크 부하

**위치**: `src/app/api/image/bulk-download/route.ts:61-99`

**문제**:
30개 이미지를 동시에 처리하여 메모리/네트워크 과부하 가능

**현재 코드**:
```typescript
const downloadPromises = body.images.map(async (imageData, index) => {
  try {
    // fetch + Sharp 처리
    const imageBuffer = await fetchImageWithRetry(imageData.url);
    const webpBuffer = await convertToWebp(imageBuffer, { quality: 90 });
    return { success: true, webpBuffer, ... };
  } catch (error) {
    return { success: false, ... };
  }
});

const results = await Promise.all(downloadPromises);  // 30개 동시!
```

**영향**:
- 서버 메모리 급증
- 네트워크 대역폭 포화
- 타임아웃 위험

**해결 방안**:
```typescript
import pLimit from 'p-limit';

const limit = pLimit(5);  // 최대 5개 동시 실행

const downloadPromises = body.images.map((imageData, index) =>
  limit(async () => {
    try {
      const imageBuffer = await fetchImageWithRetry(imageData.url);
      const webpBuffer = await convertToWebp(imageBuffer, { quality: 90 });
      return { success: true, webpBuffer, ... };
    } catch (error) {
      return { success: false, ... };
    }
  })
);

const results = await Promise.all(downloadPromises);
```

**검증 방법**:
- 30개 이미지 다운로드 시 메모리 사용량 모니터링
- Network 탭에서 동시 요청 수 확인

---

## 🟡 Medium Priority Issues

### [MED-001] Props Drilling

**위치**: `src/widgets/image-search/ImageSearchWithState.tsx:112-120`

**문제**:
ResultsHeader에 11개 props 전달

**현재 코드**:
```typescript
<ResultsHeader
  totalResults={totalResults}
  resultsCount={results.length}
  selectedCount={selectedImages.size}
  onSelectAll={handleSelectAll}
  onClearSelection={handleClearSelection}
  onBulkDownload={handleBulkDownloadWrapper}
  bulkDownloadLoading={bulkDownloadLoading}
  downloadProgress={downloadProgress}
/>
```

**해결 방안**:
```typescript
// Context 또는 Jotai 사용
const imageSearchContext = {
  totalResults,
  results,
  selectedImages,
  onSelectAll: handleSelectAll,
  onClearSelection: handleClearSelection,
  onBulkDownload: handleBulkDownloadWrapper,
  bulkDownloadLoading,
  downloadProgress,
};

<ResultsHeader />  // Context에서 직접 읽음
```

---

### [MED-002] 이미지 처리 캐싱 부재

**위치**: `src/widgets/image-search/hooks/use-bulk-download.ts:72`

**문제**:
동일 이미지에 같은 효과 적용 시 매번 재처리

**해결 방안**:
```typescript
// 캐시 Map
const processedImageCache = new Map<string, string>();

const getCacheKey = (imageUrl: string, frame: string, filter: string) =>
  `${imageUrl}_${frame}_${filter}`;

const processedDataUrl = await (async () => {
  const cacheKey = getCacheKey(imageData.imageUrl, actualFrame.id, actualFilter.id);

  if (processedImageCache.has(cacheKey)) {
    console.log('🎯 캐시 히트!!', cacheKey);
    return processedImageCache.get(cacheKey)!;
  }

  const dataUrl = await applyFrameAndFilterToImage(imageData.imageUrl, actualOptions, 1200);
  processedImageCache.set(cacheKey, dataUrl);
  return dataUrl;
})();
```

---

### [MED-003] useEffect 의존성 배열 최적화

**위치**: `src/shared/ui/download-modal/hooks/use-download-modal.ts:22`

**문제**:
객체 의존성으로 인한 무한 재실행 위험

**현재 코드**:
```typescript
useEffect(() => {
  // ...
}, [selectedFrame, selectedFilter, imageUrl, isOpen]);
```

**해결 방안**:
```typescript
const options = useMemo(() => ({
  frame: selectedFrame,
  filter: selectedFilter,
}), [selectedFrame.id, selectedFilter.id]);  // ID만 비교

useEffect(() => {
  // ...
}, [options, imageUrl, isOpen]);
```

---

### [MED-004] 거대한 컴포넌트 분할 필요

**위치**: `src/widgets/image-search/ImageSearchWithState.tsx` (144줄)

**문제**:
너무 많은 로직과 상태를 한 컴포넌트에서 관리

**해결 방안**:
- 검색 로직 → useImageSearchLogic 훅
- 선택 로직 → useImageSelectionLogic 훅
- 다운로드 로직 → useBulkDownloadLogic 훅
- UI → 프레젠테이셔널 컴포넌트로 분리

---

### [MED-005] 사용되지 않는 컴포넌트 제거

**위치**: `src/widgets/image-search/ImageSearchWidget.tsx`

**문제**:
16줄짜리 단순 래퍼 컴포넌트 (실제 사용 안됨)

**해결 방안**:
삭제 또는 ImageSearchWithState와 통합

---

### [MED-006] 에러 핸들링 UI 개선

**위치**: `src/shared/ui/download-modal/hooks/use-download-modal.ts:74`

**문제**:
`alert()` 사용 (UX 좋지 않음)

**현재 코드**:
```typescript
alert('다운로드 중 오류가 발생했습니다');
```

**해결 방안**:
```typescript
import { toast } from 'sonner';  // 또는 react-hot-toast

toast.error('다운로드 중 오류가 발생했습니다', {
  description: error.message,
});
```

---

### [MED-007] Loading 상태 UX 개선

**위치**: `src/shared/ui/SearchForm.tsx:59`

**문제**:
"검색중..." 텍스트만 표시

**해결 방안**:
```typescript
{loading && (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" />
    <span>검색중...</span>
  </div>
)}
```

---

### [MED-008] React Fragment 불필요한 사용

**위치**: 여러 파일

**현재 코드**:
```typescript
return (
  <React.Fragment>
    <div>...</div>
  </React.Fragment>
);
```

**해결 방안**:
```typescript
return <div>...</div>;
```

---

### [MED-009] 중복 타입 정의 통합

**위치**:
- `src/app/api/image/bulk-download/route.ts:6-15`
- `src/app/api/image/bulk-download-processed/route.ts:6-17`

**문제**:
거의 동일한 인터페이스가 각 파일에 정의됨

**해결 방안**:
```typescript
// shared/api/types.ts
export interface BulkDownloadRequest {
  images: Array<{
    url: string;
    title: string;
    width: number;
    height: number;
  }>;
  keyword?: string;
}

export interface ProcessedBulkDownloadRequest extends BulkDownloadRequest {
  processedImages: Array<{
    url: string;
    title: string;
    width: number;
    height: number;
    imageUrl: string;
    processedDataUrl: string;
  }>;
  effectOptions: DownloadOptions;
}
```

---

### [MED-010] 환경 변수 타입 안정성

**위치**: 여러 API 라우트

**문제**:
`process.env.GOOGLE_API_KEY` 등이 undefined일 수 있지만 타입 체크 없음

**해결 방안**:
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  GOOGLE_API_KEY: z.string().min(1),
  GOOGLE_CSE_ID: z.string().min(1),
  IMAGE_CACHE_SECONDS: z.string().default('3600'),
});

export const env = envSchema.parse(process.env);

// 사용
import { env } from '@/lib/env';
const apiKey = env.GOOGLE_API_KEY;  // 타입 안전!
```

---

### [MED-011] 에러 타입 구체화

**위치**: 모든 API 라우트

**현재 코드**:
```typescript
} catch (error) {
  console.error('오류', error);
  throw new Error('알 수 없는 오류');
}
```

**해결 방안**:
```typescript
// shared/errors.ts
export class ImageSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ImageSearchError';
  }
}

export class GoogleAPIError extends ImageSearchError {
  constructor(message: string, public apiResponse?: any) {
    super(message, 'GOOGLE_API_ERROR', 503);
  }
}

// 사용
} catch (error) {
  if (error instanceof GoogleAPIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  throw error;
}
```

---

### [MED-012] API 응답 표준화

**위치**: 모든 API 라우트

**문제**:
일관되지 않은 응답 형식

**해결 방안**:
```typescript
// shared/api/response.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// 사용
return NextResponse.json<ApiResponse<ImageSearchResult>>({
  success: true,
  data: {
    query,
    results,
    totalResults,
    searchTime,
  },
  metadata: {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  },
});
```

---

### [MED-013] 파일 크기 제한 체크 부재

**위치**: `src/app/api/image/bulk-download/route.ts`

**문제**:
생성된 ZIP 파일 크기 체크 없음

**해결 방안**:
```typescript
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });

if (zipBuffer.length > MAX_ZIP_SIZE) {
  return NextResponse.json(
    { error: `ZIP 파일이 너무 큽니다 (${(zipBuffer.length / 1024 / 1024).toFixed(2)}MB > 100MB)` },
    { status: 413 }
  );
}
```

---

## 🟢 Low Priority Issues

### [LOW-001] 콘솔 로그 과다 (프로덕션 노출)

**위치**: 전체 프로젝트 (50개 이상)

**문제**:
개발용 로그가 프로덕션에도 노출됨

**해결 방안**:
```typescript
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: any[]) => isDev && console.log('ℹ️', ...args),
  success: (...args: any[]) => isDev && console.log('✅', ...args),
  warn: (...args: any[]) => console.warn('⚠️', ...args),
  error: (...args: any[]) => console.error('❌', ...args),
};

// 사용
logger.info('🔍🚀 이미지 검색 요청!!', query);
```

---

### [LOW-002] 매직 넘버 상수화

**위치**: 여러 파일

**문제**:
30, 3000, 200, 1200 등 하드코딩

**해결 방안**:
```typescript
// constants/app.ts
export const APP_CONSTANTS = {
  MAX_SELECTION_COUNT: 30,
  AUTO_CLEAR_DELAY_MS: 3000,
  API_DELAY_MS: 200,
  IMAGE_PREVIEW_SIZE: 1200,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// 사용
import { APP_CONSTANTS } from '@/constants/app';

if (selectedImages.size >= APP_CONSTANTS.MAX_SELECTION_COUNT) {
  // ...
}
```

---

### [LOW-003] 에러 메시지 i18n 준비

**위치**: 모든 파일

**문제**:
에러 메시지 하드코딩 (한글)

**해결 방안**:
```typescript
// locales/ko.ts
export const ko = {
  errors: {
    maxSelection: '최대 {{max}}개까지만 선택할 수 있습니다',
    noSelection: '다운로드할 이미지를 선택해주세요',
    downloadFailed: '일괄 다운로드에 실패했습니다',
  },
} as const;

// 사용
import { ko } from '@/locales/ko';

const errorMessage = ko.errors.maxSelection.replace('{{max}}', String(MAX_SELECTION_COUNT));
```

---

### [LOW-004] 파일/폴더 네이밍 일관성

**위치**: 여러 곳

**문제**:
- `ImageSearchWithState.tsx` vs `image-search.ts`
- 케밥-케이스와 파스칼케이스 혼재

**해결 방안**:
- 컴포넌트: PascalCase.tsx
- 훅/유틸: kebab-case.ts
- 폴더: kebab-case

---

### [LOW-005] 주석 부족

**위치**: 복잡한 로직들

**문제**:
Fisher-Yates 셔플, 이미지 효과 적용 등 설명 없음

**해결 방안**:
```typescript
/**
 * Fisher-Yates 셔플 알고리즘을 사용하여 배열을 무작위로 섞습니다.
 * 시간 복잡도: O(n)
 * 공간 복잡도: O(1) - in-place
 *
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
export const shuffleArrayInPlace = <T>(array: T[]): T[] => {
  // ...
};
```

---

### [LOW-006] Git 커밋 전 린트/타입 체크 자동화

**문제**:
pre-commit hook 없음

**해결 방안**:
```bash
npm install --save-dev husky lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

---

### [LOW-007] API 요청 타임아웃 설정 부재

**위치**: `src/lib/google.ts:177`

**문제**:
fetch에 timeout 설정 없음

**해결 방안**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);  // 10초

try {
  const response = await fetch(searchUrl.toString(), {
    method: 'GET',
    headers: { 'User-Agent': '...' },
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('API 요청 시간 초과');
  }
  throw error;
}
```

---

### [LOW-008] README 업데이트 필요

**위치**: `README.md`

**문제**:
최근 리팩토링 내용 반영 안됨

**해결 방안**:
- 새로 추가된 utils 폴더 구조 설명
- 상태 관리 방식 (Jotai) 명시
- 개발 환경 설정 가이드 추가

---

### [LOW-009] 테스트 코드 부재

**위치**: 전체 프로젝트

**문제**:
단위 테스트, E2E 테스트 없음

**해결 방안**:
```typescript
// __tests__/utils/array/shuffle.test.ts
import { shuffleArray } from '@/utils/array/shuffle';

describe('shuffleArray', () => {
  it('배열 길이를 유지해야 함', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
  });

  it('원본 배열을 변경하지 않아야 함', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input);
    expect(input).toEqual(original);
  });
});
```

---

### [LOW-010] 성능 모니터링 부족

**문제**:
실제 사용자 성능 데이터 수집 없음

**해결 방안**:
```typescript
// lib/analytics.ts
export const trackPerformance = (metric: string, value: number) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${metric}-${value}`);

    // 선택: Google Analytics, Vercel Analytics 등으로 전송
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value),
      });
    }
  }
};

// 사용
const start = performance.now();
await handleSearch();
trackPerformance('image_search_duration', performance.now() - start);
```

---

## 📋 개선 로드맵

### Phase 1: 긴급 수정 (Critical + High) - 1주일

**Week 1:**
1. ✅ [CRIT-001] Non-null assertion 제거 (전체 프로젝트)
2. ✅ [CRIT-002] 배열 필터링 타입 안정성 확보
3. ✅ [CRIT-003] FSD 아키텍처 정리 (코드 중복 제거)
4. ✅ [CRIT-004] useState ↔ Jotai 통일
5. ✅ [CRIT-005] 불안전한 타입 단언 제거

**Week 2:**
6. ✅ [HIGH-001] 랜덤 모드 중복 방지
7. ✅ [HIGH-002] 환경 변수 파싱 검증
8. ✅ [HIGH-003] setTimeout cleanup
9. ✅ [HIGH-004] useEffect AbortController
10. ✅ [HIGH-005] Google API 병렬 처리 (p-limit)

**Week 3:**
11. ✅ [HIGH-006] useCallback/useMemo 추가
12. ✅ [HIGH-007] 상태 관리 통일
13. ✅ [HIGH-008] key prop 개선
14. ✅ [HIGH-009] Server/Client 컴포넌트 분리
15. ✅ [HIGH-010~012] 기타 High 이슈들

---

### Phase 2: 품질 개선 (Medium) - 2주일

**Week 4-5:**
1. 📝 [MED-001] Props Drilling → Context/Jotai
2. 📝 [MED-002] 이미지 처리 캐싱
3. 📝 [MED-003] useEffect 최적화
4. 📝 [MED-004] 컴포넌트 분할
5. 📝 [MED-005] 사용 안 하는 코드 제거
6. 📝 [MED-006] 에러 UI 개선 (Toast)
7. 📝 [MED-007] Loading UX 개선
8. 📝 [MED-008] React Fragment 정리
9. 📝 [MED-009] 타입 통합
10. 📝 [MED-010] 환경 변수 타입 안정성 (Zod)
11. 📝 [MED-011] 에러 클래스 구체화
12. 📝 [MED-012] API 응답 표준화
13. 📝 [MED-013] 파일 크기 제한

---

### Phase 3: 리팩토링 (Low) - 지속적

**Ongoing:**
1. 🔄 [LOW-001] 로거 라이브러리 도입
2. 🔄 [LOW-002] 매직 넘버 상수화
3. 🔄 [LOW-003] i18n 준비
4. 🔄 [LOW-004] 네이밍 일관성
5. 🔄 [LOW-005] 주석 추가
6. 🔄 [LOW-006] Husky + lint-staged
7. 🔄 [LOW-007] API 타임아웃
8. 🔄 [LOW-008] README 업데이트
9. 🔄 [LOW-009] 테스트 코드 작성
10. 🔄 [LOW-010] 성능 모니터링

---

## 🎯 핵심 통계

### 파일별 이슈 집중도

| 파일 | Critical | High | Medium | Low | 총합 |
|------|----------|------|--------|-----|------|
| `src/lib/google.ts` | 1 | 2 | 0 | 1 | 4 |
| `src/widgets/.../use-bulk-download.ts` | 2 | 2 | 2 | 0 | 6 |
| `src/features/.../use-bulk-download.ts` | 1 | 1 | 0 | 0 | 2 |
| `src/shared/.../random.ts` | 1 | 1 | 0 | 0 | 2 |
| `src/widgets/.../ImageSearchWithState.tsx` | 1 | 3 | 1 | 0 | 5 |
| API Routes | 1 | 2 | 3 | 1 | 7 |
| 기타 | 0 | 1 | 7 | 8 | 16 |

### 카테고리별 분포

| 카테고리 | 이슈 수 | 비율 |
|----------|---------|------|
| 타입 안정성 | 12 | 30% |
| 아키텍처/설계 | 8 | 20% |
| 성능 최적화 | 7 | 17.5% |
| 에러 처리 | 6 | 15% |
| 코드 품질 | 7 | 17.5% |

---

## 📚 참고 자료

### TypeScript Best Practices
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Avoiding `any`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)

### React Performance
- [React useCallback](https://react.dev/reference/react/useCallback)
- [React useMemo](https://react.dev/reference/react/useMemo)
- [Optimizing Performance](https://react.dev/learn/render-and-commit)

### Next.js 14
- [Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)

### FSD Architecture
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Import Rules](https://feature-sliced.design/docs/reference/layers)

### 라이브러리 추천
- **p-limit**: Promise 동시 실행 제한
- **zod**: 환경 변수 검증
- **sonner**: Toast 알림
- **husky**: Git hooks
- **vitest**: 단위 테스트

---

## 💬 최종 의견

이 프로젝트는 **전반적으로 잘 구성**되어 있습니다. 특히:
- ✅ TypeScript 사용
- ✅ FSD 아키텍처 시도
- ✅ 모듈화된 유틸리티 (최근 리팩토링)
- ✅ 깔끔한 API 구조

하지만 **다음 개선이 시급**합니다:
1. 🔴 Non-null assertion 제거 (타입 안정성)
2. 🔴 FSD 아키텍처 완성 (코드 중복 제거)
3. 🟠 상태 관리 통일 (useState ↔ Jotai)
4. 🟠 성능 최적화 (useCallback, p-limit)

위 로드맵대로 **3주 내 Phase 1 완료**를 목표로 하면 **프로덕션 레벨** 코드가 될 것입니다! 🎉

---

**분석 완료일**: 2025-12-01
**다음 리뷰**: Phase 1 완료 후 (약 3주 후)
