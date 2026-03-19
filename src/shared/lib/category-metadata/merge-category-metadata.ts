import type { CategoryMetadata } from '@/shared/lib/category-metadata/types';

export const mergeCategoryMetadata = (
  baseMetadata: CategoryMetadata,
  overrideMetadata: Partial<CategoryMetadata> | null,
): CategoryMetadata => {
  if (!overrideMetadata) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    ...overrideMetadata,
  };
};
