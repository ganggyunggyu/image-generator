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

/** 차단할 도메인 목록 (동영상 플랫폼) */
const BLACKLISTED_DOMAINS = [
  'youtube.com',
  'youtu.be',
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

    // 1. MIME 타입 체크 (유효하면 확장자 체크 건너뜀)
    const hasValidMime = mime
      ? VALID_IMAGE_MIMES.includes(mime.toLowerCase() as ValidImageMime)
      : false;

    if (mime && !hasValidMime) {
      console.log(`⚠️❌ MIME 타입 거부!! ${mime} 🚫 ${url}`);
      return false;
    }

    // 2. 블랙리스트 도메인 체크 (SNS 동영상 플랫폼만 차단)
    const isBlacklisted = BLACKLISTED_DOMAINS.some(domain =>
      urlObj.hostname.includes(domain)
    );

    if (isBlacklisted) {
      console.log(`🚫💀 블랙리스트 도메인 거부!! ${urlObj.hostname} ❌ ${url}`);
      return false;
    }

    // 3. 리다이렉트/프록시 URL만 차단
    const hasSuspiciousPattern = SUSPICIOUS_PATTERNS.some(pattern =>
      pathname.includes(pattern)
    );

    if (hasSuspiciousPattern) {
      console.log(`⚠️🔍 의심스러운 패턴 거부!! ${pathname} 🚫 ${url}`);
      return false;
    }

    // 4. MIME이 유효하면 확장자 무시, 아니면 확장자로 판단
    if (hasValidMime) {
      return true;
    }

    // MIME 없으면 확장자 체크
    return VALID_IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
};
