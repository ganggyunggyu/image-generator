import { FilterStyle } from './types';

export const applyImageFilter = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  filterStyle: FilterStyle
) => {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) return;

  tempCanvas.width = width;
  tempCanvas.height = height;

  tempCtx.drawImage(img, 0, 0, width, height);

  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

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

  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, x, y);
};

const applyGrayscaleFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
};

const applySepiaFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    data[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));
    data[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b));
    data[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b));
  }
};

const applyVintageFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    data[i] = Math.min(255, Math.round(0.4 * r + 0.7 * g + 0.2 * b + 20));
    data[i + 1] = Math.min(255, Math.round(0.35 * r + 0.65 * g + 0.18 * b + 10));
    data[i + 2] = Math.min(255, Math.round(0.3 * r + 0.5 * g + 0.15 * b - 10));
  }
};

const applyWarmFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i]! + 15);
    data[i + 1] = Math.min(255, data[i + 1]! + 5);
    data[i + 2] = Math.max(0, data[i + 2]! - 10);
  }
};

const applyCoolFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, data[i]! - 10);
    data[i + 1] = Math.min(255, data[i + 1]! + 5);
    data[i + 2] = Math.min(255, data[i + 2]! + 15);
  }
};

const applyDramaticFilter = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    const factor = 1.3;
    const offset = -30;

    data[i] = Math.min(255, Math.max(0, r * factor + offset));
    data[i + 1] = Math.min(255, Math.max(0, g * factor + offset));
    data[i + 2] = Math.min(255, Math.max(0, b * factor + offset));
  }
};
