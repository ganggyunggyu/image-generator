export interface ProductImages {
  body: string[];
  individual: string[];
  slide: string[];
  collage: string[];
  excludeLibrary: string[];
  excludeLibraryLink: string[];
}

export interface AiImagesResponse {
  images: ProductImages;
  metadata: Record<string, never>;
  keyword: string;
  blogId: string;
  category: string;
  folder: string;
  total: number;
  failed: number;
  folderImageCount: number;
}

interface BuildAiImagesResponseParams {
  bodyImages: string[];
  failed: number;
  folder: string;
  folderImageCount: number;
  keyword: string;
}

const createEmptyImages = (): ProductImages => ({
  body: [],
  individual: [],
  slide: [],
  collage: [],
  excludeLibrary: [],
  excludeLibraryLink: [],
});

export const EMPTY_IMAGES: ProductImages = createEmptyImages();

export const buildAiImagesResponse = ({
  bodyImages,
  failed,
  folder,
  folderImageCount,
  keyword,
}: BuildAiImagesResponseParams): AiImagesResponse => ({
  images: {
    ...createEmptyImages(),
    body: bodyImages,
  },
  metadata: {},
  keyword,
  blogId: '',
  category: '',
  folder,
  total: bodyImages.length,
  failed,
  folderImageCount,
});
