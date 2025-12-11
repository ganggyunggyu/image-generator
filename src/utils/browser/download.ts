/**
 * 브라우저 다운로드 유틸리티
 */

/**
 * Blob 데이터를 파일로 다운로드합니다.
 *
 * @param blob - 다운로드할 Blob 데이터
 * @param fileName - 저장할 파일명
 *
 * @example
 * ```ts
 * const blob = new Blob(['Hello, World!'], { type: 'text/plain' });
 * downloadBlob(blob, 'hello.txt');
 * ```
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * URL에서 파일을 다운로드합니다.
 *
 * @param url - 다운로드할 파일의 URL
 * @param fileName - 저장할 파일명
 *
 * @example
 * ```ts
 * downloadUrl('/api/image/proxy?src=...', 'image.webp');
 * ```
 */
export const downloadUrl = (url: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 현재 타임스탬프로 파일명을 생성합니다.
 *
 * @param prefix - 파일명 접두사
 * @param extension - 파일 확장자 (기본값: 'zip')
 * @returns 타임스탬프가 포함된 파일명
 *
 * @example
 * ```ts
 * generateTimestampFilename('images', 'zip');
 * // 'images_2025-12-01T15-30-45.zip'
 * ```
 */
export const generateTimestampFilename = (
  prefix: string,
  extension: string = 'zip'
): string => {
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
};

export const getFilenameFromContentDisposition = (
  contentDisposition?: string | null
): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename\s*=\s*"?([^;"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
};
