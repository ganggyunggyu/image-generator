export interface ImageResult {
  title: string;
  link: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
  };
  imageUrl: string;
  previewUrl?: string;
}

export interface SearchResponse {
  success: boolean;
  data?: {
    query: string;
    results: ImageResult[];
    totalResults: string;
    searchTime: number;
    timestamp: string;
  };
  error?: string;
  message: string;
}

export interface BulkDownloadRequest {
  images: Array<{
    url: string;
    title: string;
    width?: number;
    height?: number;
    fallbackUrls?: string[];
  }>;
}
