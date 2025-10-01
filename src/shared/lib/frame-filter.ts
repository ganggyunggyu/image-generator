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

export const FILTER_STYLES: FilterStyle[] = [
  {
    id: 'none',
    name: '필터 없음',
    preview: '🖼️',
    type: 'none',
  },
  {
    id: 'grayscale',
    name: '흑백',
    preview: '⚫',
    type: 'grayscale',
  },
  {
    id: 'sepia',
    name: '세피아',
    preview: '🟤',
    type: 'sepia',
  },
  {
    id: 'vintage',
    name: '빈티지',
    preview: '📷',
    type: 'vintage',
  },
  {
    id: 'warm',
    name: '따뜻한 색감',
    preview: '🧡',
    type: 'warm',
  },
  {
    id: 'cool',
    name: '차가운 색감',
    preview: '💙',
    type: 'cool',
  },
  {
    id: 'dramatic',
    name: '드라마틱',
    preview: '🎭',
    type: 'dramatic',
  },
];

export const FRAME_STYLES: FrameStyle[] = [
  {
    id: 'none',
    name: '액자 없음',
    preview: '⬜',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowBlur: 0,
    shadowOffset: 0,
    shadowColor: 'transparent',
  },
  {
    id: 'classic',
    name: '클래식',
    preview: '🖼️',
    borderWidth: 20,
    borderColor: '#8B4513',
    shadowBlur: 15,
    shadowOffset: 5,
    shadowColor: 'rgba(0,0,0,0.3)',
    innerBorder: {
      width: 3,
      color: '#DAA520',
    },
    pattern: 'vintage',
  },
  {
    id: 'modern',
    name: '모던',
    preview: '🔲',
    borderWidth: 12,
    borderColor: '#2C2C2C',
    shadowBlur: 20,
    shadowOffset: 3,
    shadowColor: 'rgba(0,0,0,0.4)',
    pattern: 'modern',
  },
  {
    id: 'gold',
    name: '골드',
    preview: '✨',
    borderWidth: 25,
    borderColor: '#FFD700',
    shadowBlur: 25,
    shadowOffset: 8,
    shadowColor: 'rgba(0,0,0,0.2)',
    innerBorder: {
      width: 2,
      color: '#FFA500',
    },
    pattern: 'gold',
  },
  {
    id: 'wood',
    name: '우드',
    preview: '🪵',
    borderWidth: 30,
    borderColor: '#8B4513',
    shadowBlur: 12,
    shadowOffset: 4,
    shadowColor: 'rgba(139,69,19,0.3)',
    innerBorder: {
      width: 4,
      color: '#A0522D',
    },
    pattern: 'wood',
  },
  {
    id: 'vintage',
    name: '빈티지',
    preview: '📸',
    borderWidth: 35,
    borderColor: '#F5DEB3',
    shadowBlur: 18,
    shadowOffset: 6,
    shadowColor: 'rgba(101,67,33,0.4)',
    innerBorder: {
      width: 5,
      color: '#DEB887',
    },
    pattern: 'vintage',
  },
];

export const applyFrameAndFilterToImage = async (
  imageUrl: string,
  options: DownloadOptions,
  maxWidth: number = 800
): Promise<string> => {
  const { frame: frameStyle, filter: filterStyle } = options;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다'));
          return;
        }

        // 이미지 크기 계산 (비율 유지하면서 최대 크기 제한)
        let { width: imgWidth, height: imgHeight } = img;

        if (imgWidth > maxWidth || imgHeight > maxWidth) {
          const scale = Math.min(maxWidth / imgWidth, maxWidth / imgHeight);
          imgWidth *= scale;
          imgHeight *= scale;
        }

        // 액자 포함 캔버스 크기 계산
        const frameWidth = frameStyle.borderWidth * 2;
        const canvasWidth = imgWidth + frameWidth;
        const canvasHeight = imgHeight + frameWidth;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // 배경 및 그림자 그리기
        if (frameStyle.shadowBlur > 0) {
          ctx.shadowBlur = frameStyle.shadowBlur;
          ctx.shadowOffsetX = frameStyle.shadowOffset;
          ctx.shadowOffsetY = frameStyle.shadowOffset;
          ctx.shadowColor = frameStyle.shadowColor;
        }

        // 액자 배경 그리기
        if (frameStyle.borderWidth > 0) {
          drawFrameBackground(ctx, frameStyle, canvasWidth, canvasHeight);
        }

        // 그림자 리셋
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 필터가 적용된 이미지 그리기
        const imageX = frameStyle.borderWidth;
        const imageY = frameStyle.borderWidth;

        // 필터 적용
        if (filterStyle.type !== 'none') {
          applyImageFilter(ctx, img, imageX, imageY, imgWidth, imgHeight, filterStyle);
        } else {
          ctx.drawImage(img, imageX, imageY, imgWidth, imgHeight);
        }

        // 내부 테두리 그리기
        if (frameStyle.innerBorder) {
          drawInnerBorder(ctx, frameStyle, imageX, imageY, imgWidth, imgHeight);
        }

        // 액자 패턴/텍스처 그리기
        if (frameStyle.pattern && frameStyle.borderWidth > 0) {
          drawFramePattern(ctx, frameStyle, canvasWidth, canvasHeight, imageX, imageY, imgWidth, imgHeight);
        }

        resolve(canvas.toDataURL('image/png', 1.0));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다'));
    };

    img.src = imageUrl;
  });
};

const drawFrameBackground = (
  ctx: CanvasRenderingContext2D,
  frameStyle: FrameStyle,
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.fillStyle = frameStyle.borderColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
};

const drawInnerBorder = (
  ctx: CanvasRenderingContext2D,
  frameStyle: FrameStyle,
  imageX: number,
  imageY: number,
  imgWidth: number,
  imgHeight: number
) => {
  if (!frameStyle.innerBorder) return;

  const { width, color } = frameStyle.innerBorder;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(
    imageX - width / 2,
    imageY - width / 2,
    imgWidth + width,
    imgHeight + width
  );
};

const drawFramePattern = (
  ctx: CanvasRenderingContext2D,
  frameStyle: FrameStyle,
  canvasWidth: number,
  canvasHeight: number,
  imageX: number,
  imageY: number,
  imgWidth: number,
  imgHeight: number
) => {
  const { pattern, borderWidth } = frameStyle;

  switch (pattern) {
    case 'vintage':
      drawVintagePattern(ctx, borderWidth, canvasWidth, canvasHeight);
      break;
    case 'gold':
      drawGoldPattern(ctx, borderWidth, canvasWidth, canvasHeight);
      break;
    case 'wood':
      drawWoodPattern(ctx, borderWidth, canvasWidth, canvasHeight);
      break;
    case 'modern':
      drawModernPattern(ctx, borderWidth, canvasWidth, canvasHeight);
      break;
  }
};

const drawVintagePattern = (
  ctx: CanvasRenderingContext2D,
  borderWidth: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  // 빈티지 느낌의 그라데이션
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, borderWidth);
  gradient.addColorStop(0, 'rgba(245,222,179,0.8)');
  gradient.addColorStop(0.5, 'rgba(222,184,135,0.6)');
  gradient.addColorStop(1, 'rgba(205,133,63,0.4)');

  ctx.fillStyle = gradient;

  // 상단
  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  // 하단
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  // 좌측
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  // 우측
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);
};

const drawGoldPattern = (
  ctx: CanvasRenderingContext2D,
  borderWidth: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  // 골드 그라데이션
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, borderWidth);
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(0.3, '#FFA500');
  gradient.addColorStop(0.7, '#FFD700');
  gradient.addColorStop(1, '#B8860B');

  ctx.fillStyle = gradient;

  // 액자 테두리
  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);
};

const drawWoodPattern = (
  ctx: CanvasRenderingContext2D,
  borderWidth: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  // 나무 질감 시뮬레이션
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
  gradient.addColorStop(0, '#8B4513');
  gradient.addColorStop(0.3, '#A0522D');
  gradient.addColorStop(0.7, '#8B4513');
  gradient.addColorStop(1, '#654321');

  ctx.fillStyle = gradient;

  // 액자 테두리
  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);

  // 나무 결 패턴
  ctx.strokeStyle = 'rgba(101,67,33,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < borderWidth; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvasHeight);
    ctx.stroke();
  }
};

const drawModernPattern = (
  ctx: CanvasRenderingContext2D,
  borderWidth: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  // 모던한 매트 효과
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
  gradient.addColorStop(0, '#2C2C2C');
  gradient.addColorStop(0.5, '#3C3C3C');
  gradient.addColorStop(1, '#1C1C1C');

  ctx.fillStyle = gradient;

  // 액자 테두리
  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);
};

const applyImageFilter = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  filterStyle: FilterStyle
) => {
  // 임시 캔버스에 이미지 그리기
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) return;

  tempCanvas.width = width;
  tempCanvas.height = height;

  // 원본 이미지 그리기
  tempCtx.drawImage(img, 0, 0, width, height);

  // 이미지 데이터 가져오기
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 필터 적용
  switch (filterStyle.type) {
    case 'grayscale':
      applyGrayscaleFilter(data);
      break;
    case 'sepia':
      applySepiaFilter(data);
      break;
    case 'vintage':
      applyVintageFilter(data);
      break;
    case 'warm':
      applyWarmFilter(data);
      break;
    case 'cool':
      applyCoolFilter(data);
      break;
    case 'dramatic':
      applyDramaticFilter(data);
      break;
  }

  // 필터가 적용된 데이터를 임시 캔버스에 다시 그리기
  tempCtx.putImageData(imageData, 0, 0);

  // 메인 캔버스에 필터가 적용된 이미지 그리기
  ctx.drawImage(tempCanvas, x, y);
};

const applyGrayscaleFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // data[i + 3] 은 Alpha값 유지
  }
};

const applySepiaFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));     // Red
    data[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b)); // Green
    data[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b)); // Blue
  }
};

const applyVintageFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 빈티지 효과 (세피아 + 낮은 대비 + 따뜻한 색조)
    data[i] = Math.min(255, Math.round(0.4 * r + 0.7 * g + 0.2 * b + 20));     // Red (+20 따뜻한 색조)
    data[i + 1] = Math.min(255, Math.round(0.35 * r + 0.65 * g + 0.18 * b + 10)); // Green
    data[i + 2] = Math.min(255, Math.round(0.3 * r + 0.5 * g + 0.15 * b - 10));   // Blue (-10 노란 느낌)
  }
};

const applyWarmFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] + 15);       // Red +15
    data[i + 1] = Math.min(255, data[i + 1] + 5); // Green +5
    data[i + 2] = Math.max(0, data[i + 2] - 10);   // Blue -10
  }
};

const applyCoolFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, data[i] - 10);           // Red -10
    data[i + 1] = Math.min(255, data[i + 1] + 5);  // Green +5
    data[i + 2] = Math.min(255, data[i + 2] + 15); // Blue +15
  }
};

const applyDramaticFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 대비 향상 및 채도 증가
    const factor = 1.3;
    const offset = -30;

    data[i] = Math.min(255, Math.max(0, r * factor + offset));
    data[i + 1] = Math.min(255, Math.max(0, g * factor + offset));
    data[i + 2] = Math.min(255, Math.max(0, b * factor + offset));
  }
};

// 레거시 함수 유지 (기존 코드 호환성)
export const applyFrameToImage = async (
  imageUrl: string,
  frameStyle: FrameStyle,
  maxWidth: number = 800
): Promise<string> => {
  const options: DownloadOptions = {
    frame: frameStyle,
    filter: FILTER_STYLES[0], // 필터 없음
    quality: 1.0,
  };
  return applyFrameAndFilterToImage(imageUrl, options, maxWidth);
};