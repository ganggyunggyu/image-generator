/**
 * 검색량 많은 인기 키워드 풀 (100개+)
 * 무난하고 이미지 검색 결과가 풍부한 키워드들
 */

export const POPULAR_KEYWORDS = {
  nature: [
    'sunset beach',
    'mountain landscape',
    'cherry blossom',
    'autumn leaves',
    'ocean waves',
    'forest path',
    'northern lights',
    'flower field',
    'waterfall',
    'starry night',
    'green meadow',
    'desert dunes',
    'tropical island',
    'lake reflection',
    'sunrise clouds',
  ],

  food: [
    'coffee latte art',
    'fresh sushi',
    'pizza margherita',
    'chocolate cake',
    'fresh salad',
    'gourmet burger',
    'ice cream cone',
    'pasta carbonara',
    'fruit bowl',
    'bakery bread',
    'macarons',
    'smoothie bowl',
    'grilled steak',
    'ramen noodles',
    'avocado toast',
  ],

  animals: [
    'golden retriever',
    'sleeping cat',
    'colorful parrot',
    'butterfly garden',
    'tropical fish',
    'white rabbit',
    'barn owl',
    'dolphin jumping',
    'giant panda',
    'red fox',
    'hummingbird',
    'sea turtle',
    'koala bear',
    'peacock feathers',
    'baby elephant',
  ],

  urban: [
    'city skyline',
    'modern architecture',
    'street cafe paris',
    'neon tokyo',
    'brooklyn bridge',
    'cozy bedroom',
    'bookshelf library',
    'classic car',
    'subway station',
    'rooftop garden',
    'coffee shop interior',
    'office workspace',
    'shopping street',
    'hotel lobby',
    'restaurant terrace',
  ],

  lifestyle: [
    'yoga meditation',
    'home office desk',
    'plant collection',
    'candle relaxation',
    'spa wellness',
    'fitness workout',
    'morning routine',
    'cozy reading',
    'cooking kitchen',
    'garden balcony',
    'travel luggage',
    'picnic blanket',
    'camping tent',
    'bicycle ride',
    'beach vacation',
  ],

  art: [
    'watercolor painting',
    'geometric pattern',
    'minimalist design',
    'abstract colorful',
    'marble texture',
    'gradient colors',
    'bokeh lights',
    'ink splash',
    'crystal gem',
    'rainbow sky',
    'oil painting',
    'digital art',
    'sketch drawing',
    'mosaic tiles',
    'graffiti wall',
  ],

  technology: [
    'laptop workspace',
    'smartphone screen',
    'headphones music',
    'camera photography',
    'smart watch',
    'keyboard typing',
    'gaming setup',
    'drone aerial',
    'electric car',
    'robot technology',
  ],

  seasonal: [
    'spring garden',
    'summer pool',
    'autumn park',
    'winter cabin',
    'rainy window',
    'sunny day',
    'foggy forest',
    'snowy mountain',
    'blooming tulips',
    'harvest pumpkins',
  ],

  objects: [
    'vintage clock',
    'leather bag',
    'sunglasses fashion',
    'perfume bottle',
    'ceramic vase',
    'wooden furniture',
    'glass bottle',
    'wicker basket',
    'silk fabric',
    'gold jewelry',
  ],
} as const;

export type KeywordCategory = keyof typeof POPULAR_KEYWORDS;

export const ALL_KEYWORDS = Object.values(POPULAR_KEYWORDS).flat();

export const getRandomKeyword = (category?: KeywordCategory): string => {
  if (category && POPULAR_KEYWORDS[category]) {
    const keywords = POPULAR_KEYWORDS[category];
    return keywords[Math.floor(Math.random() * keywords.length)]!;
  }

  return ALL_KEYWORDS[Math.floor(Math.random() * ALL_KEYWORDS.length)]!;
};

export const getRandomKeywords = (count: number, category?: KeywordCategory): string[] => {
  const pool = category ? [...POPULAR_KEYWORDS[category]] : [...ALL_KEYWORDS];
  const result: string[] = [];
  const actualCount = Math.min(count, pool.length);

  for (let i = 0; i < actualCount; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result.push(pool[randomIndex]!);
    pool.splice(randomIndex, 1);
  }

  return result;
};

export const getCategories = (): KeywordCategory[] => {
  return Object.keys(POPULAR_KEYWORDS) as KeywordCategory[];
};

// 총 키워드 수 확인용
export const TOTAL_KEYWORDS_COUNT = ALL_KEYWORDS.length;
