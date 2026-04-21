export interface PetProcessorPreset {
  id: string;
  label: string;
  title: string;
  description: string;
  query: string;
  quickKeywords: string[];
  placeholder: string;
}

export const PET_PROCESSOR_PRESETS: PetProcessorPreset[] = [
  {
    id: 'breed',
    label: '품종 탐색',
    title: '분양 글과 품종 소개에 바로 쓰는 이미지 묶음',
    description: '대표 품종명을 중심으로 선명한 얼굴샷과 전신샷을 빠르게 모으기 좋음',
    query: '골든 리트리버',
    quickKeywords: ['골든 리트리버', '말티푸', '포메라니안', '비숑 프리제'],
    placeholder: '예: 골든 리트리버, 말티푸, 포메라니안',
  },
  {
    id: 'lifestyle',
    label: '생활 장면',
    title: '산책, 놀이, 가족컷처럼 감정선이 있는 장면 수집',
    description: '블로그 본문이나 썸네일에 잘 맞는 자연스러운 반려견 라이프스타일 컷을 찾기 좋음',
    query: '강아지 산책',
    quickKeywords: ['강아지 산책', '반려견 가족사진', '강아지 장난감 놀이', '강아지 카페'],
    placeholder: '예: 강아지 산책, 반려견 가족사진, 강아지 카페',
  },
  {
    id: 'adoption',
    label: '분양 키워드',
    title: '분양/상담형 콘텐츠에 자주 쓰는 키워드 시작점',
    description: '상담 문의형 키워드를 바로 넣고 필요한 이미지를 추려내기 좋은 구성임',
    query: '강아지 무료분양',
    quickKeywords: ['강아지 무료분양', '소형견 분양', '말티즈 분양', '푸들 분양'],
    placeholder: '예: 강아지 무료분양, 소형견 분양, 말티즈 분양',
  },
];

const DEFAULT_PRESET = PET_PROCESSOR_PRESETS[0];

if (!DEFAULT_PRESET) {
  throw new Error('애견 프리셋 구성이 비어 있음');
}

export const getPetProcessorPreset = (presetId?: string): PetProcessorPreset => {
  if (!presetId) {
    return DEFAULT_PRESET;
  }

  return PET_PROCESSOR_PRESETS.find(({ id }) => id === presetId) ?? DEFAULT_PRESET;
};

export const getPetProcessorFeaturedQueries = (): string[] => {
  const seenQueries = new Set<string>();

  return PET_PROCESSOR_PRESETS.flatMap(({ quickKeywords }) => quickKeywords).filter((keyword) => {
    if (seenQueries.has(keyword)) {
      return false;
    }

    seenQueries.add(keyword);
    return true;
  });
};
