import sharp from 'sharp';
import { FilterStyle, FrameStyle } from '@/shared/lib/frame-filter';

export const applyFilter = async (
  imageBuffer: Buffer,
  filter: FilterStyle
): Promise<Buffer> => {
  if (filter.id === 'none') return imageBuffer;

  let sharpImage = sharp(imageBuffer);

  switch (filter.type) {
    case 'grayscale':
      sharpImage = sharpImage.grayscale();
      break;

    case 'sepia':
      sharpImage = sharpImage.recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
      ]);
      break;

    case 'vintage':
      sharpImage = sharpImage
        .modulate({ saturation: 0.8, brightness: 1.1 })
        .recomb([
          [0.393, 0.769, 0.189],
          [0.349, 0.686, 0.168],
          [0.272, 0.534, 0.131],
        ])
        .gamma(1.1);
      break;

    case 'warm':
      sharpImage = sharpImage
        .modulate({ saturation: 1.2 })
        .tint({ r: 255, g: 220, b: 180 });
      break;

    case 'cool':
      sharpImage = sharpImage
        .modulate({ saturation: 0.9 })
        .tint({ r: 180, g: 200, b: 255 });
      break;

    case 'dramatic':
      sharpImage = sharpImage
        .modulate({ saturation: 1.3, brightness: 0.9 })
        .sharpen({ sigma: 1.5 })
        .linear(1.2, -20);
      break;
  }

  return sharpImage.toBuffer();
};

export const applyFrame = async (
  imageBuffer: Buffer,
  frame: FrameStyle
): Promise<Buffer> => {
  if (frame.id === 'none' || !frame.borderWidth) return imageBuffer;

  const borderWidth = frame.borderWidth;
  const borderColor = frame.borderColor || '#000000';

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16),
    };
  };

  const rgb = hexToRgb(borderColor);

  return sharp(imageBuffer)
    .extend({
      top: borderWidth,
      bottom: borderWidth,
      left: borderWidth,
      right: borderWidth,
      background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 },
    })
    .toBuffer();
};

export const applyEffects = async (
  imageBuffer: Buffer,
  filter: FilterStyle,
  frame: FrameStyle
): Promise<Buffer> => {
  let result = imageBuffer;

  if (filter.id !== 'none') {
    result = await applyFilter(result, filter);
  }

  if (frame.id !== 'none') {
    result = await applyFrame(result, frame);
  }

  return result;
};
