export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'] as const;
export const IMAGE_REGEX = /\.(png|jpg|jpeg|webp|gif)$/i;

export const isImageFile = (filename: string): boolean =>
  IMAGE_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));

export const filterImageFiles = (files: string[]): string[] =>
  files.filter((f) => IMAGE_REGEX.test(f));
