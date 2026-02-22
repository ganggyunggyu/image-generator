import sharp from 'sharp';
import { FilterStyle, FrameStyle } from '@/shared/lib/frame-filter';

const TRANSPARENT_BACKGROUND = { r: 0, g: 0, b: 0, alpha: 0 } as const;

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

/**
 * 네이버 유사 이미지 검색 회피를 위한 강한 랜덤 왜곡 적용
 * - 비율 왜곡 (10-25% 랜덤 스트레치)
 * - 회전 (-8° ~ +8°)
 * - 수평 뒤집기 (50% 확률)
 * - 크롭 (10-20% 가장자리 제거)
 * - 색상 조정 (밝기/채도 ±20%, hue ±15)
 * - 대비/감마 조정
 * - 블러/샤프닝
 * - 원근 왜곡 (perspective)
 * - 기울이기 (skew)
 */
export const applyDistortion = async (imageBuffer: Buffer): Promise<Buffer> => {
  const metadata = await sharp(imageBuffer).metadata();
  const { width = 800, height = 600 } = metadata;

  // 강화된 랜덤 파라미터
  const ratioX = 1 + (Math.random() * 0.15 + 0.1) * (Math.random() > 0.5 ? 1 : -1); // 10-25%
  const ratioY = 1 + (Math.random() * 0.15 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
  const rotation = Math.random() * 16 - 8; // -8 ~ +8도
  const shouldFlip = Math.random() > 0.5;
  const cropPercent = 0.1 + Math.random() * 0.1; // 10-20%
  const brightness = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
  const saturation = 0.8 + Math.random() * 0.4;
  const hue = Math.round(Math.random() * 30 - 15); // -15 ~ +15
  const contrast = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
  const gamma = 1.0 + Math.random() * 0.3; // 1.0 ~ 1.3
  const shouldBlur = Math.random() > 0.7; // 30% 확률
  const shouldSharpen = !shouldBlur && Math.random() > 0.7; // 블러 없을 때 30% 확률

  // 원근 왜곡 (perspective): 상/하단 폭 차이 -4% ~ +4%
  const perspectiveX = (Math.random() * 0.08 - 0.04);
  // 기울이기 (skew): -3° ~ +3°
  const skewDeg = Math.random() * 6 - 3;
  const skewRad = (skewDeg * Math.PI) / 180;

  // 크롭 영역 계산
  const cropX = Math.floor(width * cropPercent);
  const cropY = Math.floor(height * cropPercent);
  const cropWidth = width - cropX * 2;
  const cropHeight = height - cropY * 2;

  // 새 크기 계산 (비율 왜곡)
  const newWidth = Math.round(cropWidth * ratioX);
  const newHeight = Math.round(cropHeight * ratioY);

  // affine 변환 매트릭스
  const skewMatrix: [number, number, number, number] = [
    1 + perspectiveX,
    Math.tan(skewRad),
    0,
    1 - perspectiveX,
  ];

  let sharpImage = sharp(imageBuffer)
    .ensureAlpha()
    .extract({
      left: cropX,
      top: cropY,
      width: Math.max(cropWidth, 1),
      height: Math.max(cropHeight, 1),
    })
    .resize(newWidth, newHeight, { fit: 'fill' })
    .affine(skewMatrix, { background: TRANSPARENT_BACKGROUND })
    .rotate(rotation, { background: TRANSPARENT_BACKGROUND })
    .modulate({ brightness, saturation, hue })
    .linear(contrast, 0)
    .gamma(gamma);

  if (shouldFlip) {
    sharpImage = sharpImage.flop();
  }

  if (shouldBlur) {
    sharpImage = sharpImage.blur(0.5 + Math.random() * 0.5); // 0.5 ~ 1.0
  }

  if (shouldSharpen) {
    sharpImage = sharpImage.sharpen({ sigma: 0.5 + Math.random() * 1 });
  }

  console.log(`🔀 강한 왜곡: ratio(${ratioX.toFixed(2)}x${ratioY.toFixed(2)}) rot(${rotation.toFixed(1)}°) flip(${shouldFlip}) crop(${(cropPercent * 100).toFixed(0)}%) bright(${brightness.toFixed(2)}) sat(${saturation.toFixed(2)}) hue(${hue}) contrast(${contrast.toFixed(2)}) gamma(${gamma.toFixed(2)}) perspective(${(perspectiveX * 100).toFixed(1)}%) skew(${skewDeg.toFixed(1)}°) blur(${shouldBlur}) sharp(${shouldSharpen})`);

  return sharpImage.toBuffer();
};

/**
 * 가벼운 왜곡 (유사 이미지 검색 회피용)
 * - 밝기/채도 조정
 * - 크롭
 * - 미세 비율 왜곡
 * - 감마 조정
 * - 원근 왜곡 (perspective)
 * - 기울이기 (skew)
 */
export const applyLightDistortion = async (imageBuffer: Buffer): Promise<Buffer> => {
  const metadata = await sharp(imageBuffer).metadata();
  const { width = 800, height = 600 } = metadata;

  const brightness = 0.80 + Math.random() * 0.4; // 0.80 ~ 1.20
  const saturation = 0.80 + Math.random() * 0.4; // 0.80 ~ 1.20
  const hue = Math.floor(Math.random() * 25) - 12; // -12 ~ +12
  const cropPercent = 0.02 + Math.random() * 0.08; // 2-10%
  const gamma = 1.0 + Math.random() * 0.3; // 1.0 ~ 1.3
  const ratioX = 1 + (Math.random() * 0.06 - 0.03); // -3% ~ +3%
  const ratioY = 1 + (Math.random() * 0.06 - 0.03);

  // 원근 왜곡 (perspective): 상/하단 폭 차이 -2% ~ +2%
  const perspectiveX = (Math.random() * 0.04 - 0.02);
  // 기울이기 (skew): -1.5° ~ +1.5°
  const skewDeg = Math.random() * 3 - 1.5;
  const skewRad = (skewDeg * Math.PI) / 180;

  const cropX = Math.floor(width * cropPercent);
  const cropY = Math.floor(height * cropPercent);
  const cropWidth = width - cropX * 2;
  const cropHeight = height - cropY * 2;
  const newWidth = Math.round(cropWidth * ratioX);
  const newHeight = Math.round(cropHeight * ratioY);

  // affine 변환 매트릭스: [a, b, c, d] -> x' = ax + by, y' = cx + dy
  // skew: 수평 기울이기는 b = tan(angle), 수직은 c = tan(angle)
  const skewMatrix: [number, number, number, number] = [
    1 + perspectiveX, // a: 약간의 수평 스케일 변형
    Math.tan(skewRad), // b: 수평 기울이기
    0, // c: 수직 기울이기 (0으로 유지)
    1 - perspectiveX, // d: 약간의 수직 스케일 변형 (반대 방향)
  ];

  console.log(`🔀 가벼운 왜곡: bright(${brightness.toFixed(2)}) sat(${saturation.toFixed(2)}) hue(${hue}) crop(${(cropPercent * 100).toFixed(1)}%) gamma(${gamma.toFixed(2)}) ratio(${ratioX.toFixed(3)}x${ratioY.toFixed(3)}) perspective(${(perspectiveX * 100).toFixed(1)}%) skew(${skewDeg.toFixed(1)}°)`);

  return sharp(imageBuffer)
    .ensureAlpha()
    .extract({
      left: cropX,
      top: cropY,
      width: Math.max(cropWidth, 1),
      height: Math.max(cropHeight, 1),
    })
    .resize(Math.max(newWidth, 1), Math.max(newHeight, 1), { fit: 'fill' })
    .affine(skewMatrix, { background: TRANSPARENT_BACKGROUND })
    .modulate({ brightness, saturation, hue })
    .gamma(gamma)
    .toBuffer();
};

export const applyEffects = async (
  imageBuffer: Buffer,
  filter: FilterStyle,
  frame: FrameStyle,
  options?: { distortion?: boolean }
): Promise<Buffer> => {
  let result = imageBuffer;

  if (filter.id !== 'none') {
    result = await applyFilter(result, filter);
  }

  if (frame.id !== 'none') {
    result = await applyFrame(result, frame);
  }

  // 왜곡은 마지막에 (액자 포함해서 전체 왜곡)
  if (options?.distortion) {
    result = await applyDistortion(result);
  }

  return result;
};
