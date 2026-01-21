import { FRAME_STYLES, FILTER_STYLES } from './constants';
import type { FrameStyle, FilterStyle } from './types';

/**
 * 랜덤 프레임/필터 선택 유틸리티
 */

/**
 * 실제 프레임 스타일 목록을 반환합니다. ('none'과 'random' 제외)
 *
 * @returns 실제 프레임 스타일 배열
 */
export const getRealFrameStyles = (): FrameStyle[] => {
  return FRAME_STYLES.filter(f => f.id !== 'none' && f.id !== 'random');
};

/**
 * 실제 필터 스타일 목록을 반환합니다. ('random' 제외, 'none' 포함)
 *
 * @returns 실제 필터 스타일 배열
 */
export const getRealFilterStyles = (): FilterStyle[] => {
  return FILTER_STYLES.filter(f => f.id !== 'random');
};

/**
 * 랜덤 프레임 스타일을 선택합니다.
 *
 * @returns 랜덤하게 선택된 프레임 스타일
 *
 * @example
 * ```ts
 * const randomFrame = selectRandomFrame();
 * console.log(randomFrame.name); // '클래식' | '모던' | '빈티지' 등
 * ```
 */
export const selectRandomFrame = (): FrameStyle => {
  const realFrames = getRealFrameStyles();
  if (realFrames.length === 0) {
    throw new Error('사용 가능한 프레임이 없습니다');
  }
  return realFrames[Math.floor(Math.random() * realFrames.length)]!;
};

/**
 * 랜덤 필터 스타일을 선택합니다.
 *
 * @returns 랜덤하게 선택된 필터 스타일
 *
 * @example
 * ```ts
 * const randomFilter = selectRandomFilter();
 * console.log(randomFilter.name); // '흑백' | '세피아' | '비네트' 등
 * ```
 */
export const selectRandomFilter = (): FilterStyle => {
  const realFilters = getRealFilterStyles();
  if (realFilters.length === 0) {
    throw new Error('사용 가능한 필터가 없습니다');
  }
  return realFilters[Math.floor(Math.random() * realFilters.length)]!;
};

/**
 * 프레임이 랜덤 옵션인지 확인합니다.
 *
 * @param frame - 확인할 프레임 스타일
 * @returns 랜덤 옵션이면 true
 */
export const isRandomFrame = (frame: FrameStyle): boolean => {
  return frame.id === 'random';
};

/**
 * 필터가 랜덤 옵션인지 확인합니다.
 *
 * @param filter - 확인할 필터 스타일
 * @returns 랜덤 옵션이면 true
 */
export const isRandomFilter = (filter: FilterStyle): boolean => {
  return filter.id === 'random';
};

/**
 * 프레임 스타일을 랜덤 또는 지정된 값으로 반환합니다.
 * 랜덤 옵션이면 실제 스타일 중 하나를 랜덤 선택합니다.
 *
 * @param frame - 프레임 스타일
 * @returns 최종 프레임 스타일
 */
export const resolveFrame = (frame: FrameStyle): FrameStyle => {
  return isRandomFrame(frame) ? selectRandomFrame() : frame;
};

/**
 * 필터 스타일을 랜덤 또는 지정된 값으로 반환합니다.
 * 랜덤 옵션이면 실제 스타일 중 하나를 랜덤 선택합니다.
 *
 * @param filter - 필터 스타일
 * @returns 최종 필터 스타일
 */
export const resolveFilter = (filter: FilterStyle): FilterStyle => {
  return isRandomFilter(filter) ? selectRandomFilter() : filter;
};
