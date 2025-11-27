import { FrameStyle } from './types';

export const drawFrameBackground = (
  ctx: CanvasRenderingContext2D,
  frameStyle: FrameStyle,
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.fillStyle = frameStyle.borderColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
};

export const drawInnerBorder = (
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

export const drawFramePattern = (
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
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, borderWidth);
  gradient.addColorStop(0, 'rgba(245,222,179,0.8)');
  gradient.addColorStop(0.5, 'rgba(222,184,135,0.6)');
  gradient.addColorStop(1, 'rgba(205,133,63,0.4)');

  ctx.fillStyle = gradient;

  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);
};

const drawGoldPattern = (
  ctx: CanvasRenderingContext2D,
  borderWidth: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, borderWidth);
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(0.3, '#FFA500');
  gradient.addColorStop(0.7, '#FFD700');
  gradient.addColorStop(1, '#B8860B');

  ctx.fillStyle = gradient;

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
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
  gradient.addColorStop(0, '#8B4513');
  gradient.addColorStop(0.3, '#A0522D');
  gradient.addColorStop(0.7, '#8B4513');
  gradient.addColorStop(1, '#654321');

  ctx.fillStyle = gradient;

  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);

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
  const gradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
  gradient.addColorStop(0, '#2C2C2C');
  gradient.addColorStop(0.5, '#3C3C3C');
  gradient.addColorStop(1, '#1C1C1C');

  ctx.fillStyle = gradient;

  ctx.fillRect(0, 0, canvasWidth, borderWidth);
  ctx.fillRect(0, canvasHeight - borderWidth, canvasWidth, borderWidth);
  ctx.fillRect(0, 0, borderWidth, canvasHeight);
  ctx.fillRect(canvasWidth - borderWidth, 0, borderWidth, canvasHeight);
};
