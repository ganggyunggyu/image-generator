export interface FrameStyle {
  id: string;
  name: string;
  preview: string;
  borderWidth: number;
  borderColor: string;
  shadowBlur: number;
  shadowOffset: number;
  shadowColor: string;
  innerBorder?: {
    width: number;
    color: string;
  };
  pattern?: 'solid' | 'vintage' | 'gold' | 'wood' | 'modern';
}

export interface FilterStyle {
  id: string;
  name: string;
  preview: string;
  type: 'none' | 'grayscale' | 'sepia' | 'vintage' | 'warm' | 'cool' | 'dramatic';
}

export interface DownloadOptions {
  frame: FrameStyle;
  filter: FilterStyle;
  quality: number;
}
