/**
 * 배열 셔플 유틸리티 (Fisher-Yates 알고리즘)
 */

/**
 * Fisher-Yates 셔플 알고리즘을 사용하여 배열을 무작위로 섞습니다.
 * 원본 배열을 변경하지 않고 새로운 배열을 반환합니다.
 *
 * @template T - 배열 요소의 타입
 * @param array - 셔플할 배열
 * @returns 섞인 새로운 배열
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray(numbers);
 * console.log(shuffled); // [3, 1, 5, 2, 4] (무작위)
 * console.log(numbers); // [1, 2, 3, 4, 5] (원본 유지)
 * ```
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result;
};

/**
 * Fisher-Yates 셔플 알고리즘을 사용하여 배열을 원본 그대로 섞습니다.
 * 원본 배열을 직접 변경합니다.
 *
 * @template T - 배열 요소의 타입
 * @param array - 셔플할 배열 (원본 변경됨)
 * @returns 섞인 원본 배열 (참조 반환)
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5];
 * shuffleArrayInPlace(numbers);
 * console.log(numbers); // [3, 1, 5, 2, 4] (원본 변경됨)
 * ```
 */
export const shuffleArrayInPlace = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }

  return array;
};
