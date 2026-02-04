export const SUB_FOLDERS = ['본문', '개별', '슬라이드', '콜라주', '라이브러리제외', '라이브러리제외_링크'] as const;
export type SubFolder = (typeof SUB_FOLDERS)[number];
