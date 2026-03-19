import { hanryeodamwonSheetEnhancer } from '@/shared/lib/category-metadata/enhancers/hanryeodamwon-sheet-enhancer';
import { mergeCategoryMetadata } from '@/shared/lib/category-metadata/merge-category-metadata';
import type { CategoryMetadata, CategoryMetadataContext } from '@/shared/lib/category-metadata/types';

const enhancers = [hanryeodamwonSheetEnhancer];

interface ResolveCategoryMetadataParams {
  category: string;
  keyword?: string;
  dateCode?: string;
  blogName?: string;
  baseMetadata: CategoryMetadata;
}

export const resolveCategoryMetadata = async ({
  category,
  keyword,
  dateCode,
  blogName,
  baseMetadata,
}: ResolveCategoryMetadataParams): Promise<CategoryMetadata> => {
  const context: CategoryMetadataContext = {
    category,
    baseMetadata,
    ...(keyword === undefined ? {} : { keyword }),
    ...(dateCode === undefined ? {} : { dateCode }),
    ...(blogName === undefined ? {} : { blogName }),
  };
  const enhancer = enhancers.find((candidate) => candidate.supports(context));

  if (!enhancer) {
    return baseMetadata;
  }

  const overrideMetadata = await enhancer.enhance(context);
  return mergeCategoryMetadata(baseMetadata, overrideMetadata);
};
