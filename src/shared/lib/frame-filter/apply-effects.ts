import { FrameStyle, FilterStyle, DownloadOptions } from './types';
import { FILTER_STYLES } from './constants';
import { drawFrameBackground, drawInnerBorder, drawFramePattern } from './canvas-utils';
import { applyImageFilter } from './filters';

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

        let { width: imgWidth, height: imgHeight } = img;

        if (imgWidth > maxWidth || imgHeight > maxWidth) {
          const scale = Math.min(maxWidth / imgWidth, maxWidth / imgHeight);
          imgWidth *= scale;
          imgHeight *= scale;
        }

        const frameWidth = frameStyle.borderWidth * 2;
        const canvasWidth = imgWidth + frameWidth;
        const canvasHeight = imgHeight + frameWidth;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        if (frameStyle.shadowBlur > 0) {
          ctx.shadowBlur = frameStyle.shadowBlur;
          ctx.shadowOffsetX = frameStyle.shadowOffset;
          ctx.shadowOffsetY = frameStyle.shadowOffset;
          ctx.shadowColor = frameStyle.shadowColor;
        }

        if (frameStyle.borderWidth > 0) {
          drawFrameBackground(ctx, frameStyle, canvasWidth, canvasHeight);
        }

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const imageX = frameStyle.borderWidth;
        const imageY = frameStyle.borderWidth;

        if (filterStyle.type !== 'none') {
          applyImageFilter(ctx, img, imageX, imageY, imgWidth, imgHeight, filterStyle);
        } else {
          ctx.drawImage(img, imageX, imageY, imgWidth, imgHeight);
        }

        if (frameStyle.innerBorder) {
          drawInnerBorder(ctx, frameStyle, imageX, imageY, imgWidth, imgHeight);
        }

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

export const applyFrameToImage = async (
  imageUrl: string,
  frameStyle: FrameStyle,
  maxWidth: number = 800
): Promise<string> => {
  const options: DownloadOptions = {
    frame: frameStyle,
    filter: FILTER_STYLES[0],
    quality: 1.0,
  };
  return applyFrameAndFilterToImage(imageUrl, options, maxWidth);
};
