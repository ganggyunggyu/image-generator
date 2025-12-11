/**
 * 이미지 URL 유효성 검증 유틸리티
 */

/** 지원하는 이미지 MIME 타입 */
const VALID_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;

type ValidImageMime = typeof VALID_IMAGE_MIMES[number];

/** 지원하는 이미지 파일 확장자 */
const VALID_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
] as const;

/** 차단할 도메인 목록 (동영상 플랫폼 및 썸네일) */
const BLACKLISTED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'ytimg.com',
  'i.ytimg.com',
  'img.youtube.com',
  'tiktok.com',
  'twitch.tv',
] as const;

/** 차단할 URL 패턴 (리다이렉트/프록시) */
const SUSPICIOUS_PATTERNS = [
  'redirect.php',
  'proxy.php',
  'go.php',
] as const;

/**
 * 이미지 URL의 유효성을 검증합니다.
 *
 * @param url - 검증할 이미지 URL
 * @param mime - 이미지 MIME 타입 (선택)
 * @returns 유효한 이미지 URL이면 true, 아니면 false
 *
 * @example
 * ```ts
 * isValidImageUrl('https://example.com/image.jpg') // true
 * isValidImageUrl('https://youtube.com/video', 'video/mp4') // false
 * ```
 */
export const isValidImageUrl = (url: string, mime?: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // 1. 블랙리스트 도메인 체크 먼저 (SNS 동영상 플랫폼 차단)
    const isBlacklisted = BLACKLISTED_DOMAINS.some(domain =>
      urlObj.hostname.includes(domain)
    );

    if (isBlacklisted) {
      return false;
    }

    // 2. 리다이렉트/프록시 URL 차단
    const hasSuspiciousPattern = SUSPICIOUS_PATTERNS.some(pattern =>
      pathname.includes(pattern)
    );

    if (hasSuspiciousPattern) {
      return false;
    }

    // 3. MIME 타입 체크 (image/로 시작하면 통과)
    if (mime) {
      const lowerMime = mime.toLowerCase();
      if (lowerMime.startsWith('image/')) {
        return true;
      }
      // image/가 아닌 MIME은 거부
      return false;
    }

    // 4. MIME 없으면 확장자 체크
    return VALID_IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
};
