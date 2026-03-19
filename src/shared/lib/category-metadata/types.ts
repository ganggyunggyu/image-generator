export interface CategoryMetadata {
  mapQueries?: string[];
  phone?: string;
  url?: string;
  lib_url?: string[];
}

export interface CategoryMetadataContext {
  category: string;
  keyword?: string;
  dateCode?: string;
  blogName?: string;
  baseMetadata: CategoryMetadata;
}

export interface CategoryMetadataEnhancer {
  supports: (context: CategoryMetadataContext) => boolean;
  enhance: (context: CategoryMetadataContext) => Promise<Partial<CategoryMetadata> | null>;
}
