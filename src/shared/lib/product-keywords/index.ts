export interface KeywordMapping {
  keyword: string;
  folder: string;
  aliases?: string[];
}

const keywordMappings: KeywordMapping[] = [
  { keyword: '케이온', folder: '케이온', aliases: ['k-on', 'keion', '경음부'] },
  { keyword: '시바견', folder: '시바견', aliases: ['shiba', 'shiba inu', '시바', '시바이누'] },
  { keyword: '뱅갈고양이', folder: '뱅갈고양이', aliases: ['bengal', 'bengal cat', '뱅갈'] },
];

export const getProductFolder = (keyword: string): string | null => {
  const normalized = keyword.toLowerCase().trim();

  for (const mapping of keywordMappings) {
    if (mapping.keyword.toLowerCase() === normalized) {
      return mapping.folder;
    }
    if (mapping.aliases?.some((alias) => alias.toLowerCase() === normalized)) {
      return mapping.folder;
    }
  }

  return null;
};

export const getDefaultFolder = (): string => '케이온';

export const getAllKeywords = (): string[] => {
  return keywordMappings.map((m) => m.keyword);
};
