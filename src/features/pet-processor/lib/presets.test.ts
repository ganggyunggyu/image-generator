import { describe, expect, it } from 'vitest';
import {
  PET_PROCESSOR_PRESETS,
  getPetProcessorFeaturedQueries,
  getPetProcessorPreset,
} from './presets';

describe('pet processor presets', () => {
  it('falls back to the default preset when preset id is missing or unknown', () => {
    expect(getPetProcessorPreset().id).toBe(PET_PROCESSOR_PRESETS[0].id);
    expect(getPetProcessorPreset('unknown').id).toBe(PET_PROCESSOR_PRESETS[0].id);
  });

  it('returns the requested preset configuration', () => {
    const preset = getPetProcessorPreset('adoption');

    expect(preset.label).toBe('분양 키워드');
    expect(preset.query).toBe('강아지 무료분양');
    expect(preset.quickKeywords).toContain('말티즈 분양');
  });

  it('returns a de-duplicated featured keyword list in declaration order', () => {
    expect(getPetProcessorFeaturedQueries()).toEqual([
      '골든 리트리버',
      '말티푸',
      '포메라니안',
      '비숑 프리제',
      '강아지 산책',
      '반려견 가족사진',
      '강아지 장난감 놀이',
      '강아지 카페',
      '강아지 무료분양',
      '소형견 분양',
      '말티즈 분양',
      '푸들 분양',
    ]);
  });
});
