import sharp from 'sharp';

export const getImageMetadata = async (imageBuffer: Buffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      size: imageBuffer.length,
    };
  } catch (error) {
    console.error('메타데이터 추출 실패:', error);
    throw new Error('이미지 메타데이터를 읽을 수 없습니다');
  }
};

export const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const allowedProtocols = ['http:', 'https:'];

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];

    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    const hasImageParam = urlObj.searchParams.toString().includes('image') ||
                         urlObj.searchParams.toString().includes('photo') ||
                         urlObj.searchParams.toString().includes('pic');

    return hasImageExtension || hasImageParam || pathname.includes('image');
  } catch {
    return false;
  }
};
