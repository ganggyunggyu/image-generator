import type { CategoryMetadataContext, CategoryMetadataEnhancer } from '@/shared/lib/category-metadata/types';
import { getHanryeodamwonTaggedUrl } from '@/shared/lib/category-metadata/google-sheet/hanryeodamwon-blog-utm-sheet';

const HANRYE_CATEGORY = '한려담원';

const supportsHanryeodamwonSheetEnhancer = ({
  category,
  keyword,
  dateCode,
  blogName,
}: CategoryMetadataContext): boolean => {
  return (
    category.trim() === HANRYE_CATEGORY &&
    Boolean(keyword?.trim()) &&
    Boolean(dateCode?.trim()) &&
    Boolean(blogName?.trim())
  );
};

export const hanryeodamwonSheetEnhancer: CategoryMetadataEnhancer = {
  supports: supportsHanryeodamwonSheetEnhancer,
  enhance: async ({ keyword, dateCode, blogName }) => {
    if (!keyword?.trim() || !dateCode?.trim() || !blogName?.trim()) {
      return null;
    }

    try {
      const url = await getHanryeodamwonTaggedUrl({
        keyword,
        dateCode,
        blogName,
      });
      return url ? { url } : null;
    } catch (error) {
      console.error('❌ 한려담원 시트 링크 조회 실패:', error);
      return null;
    }
  },
};
