export const fetchImageBuffer = async (imageUrl: string, retryCount: number = 3): Promise<Buffer> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      console.log(`이미지 fetch 시도 ${attempt + 1}/${retryCount}:`, imageUrl);

      // URL 인코딩: 한글/특수문자 처리
      let encodedUrl = imageUrl;
      try {
        const urlObj = new URL(imageUrl);
        // 이미 인코딩된 URL은 그대로 사용
        encodedUrl = imageUrl;
      } catch {
        // URL 파싱 실패 시 인코딩 시도
        encodedUrl = encodeURI(imageUrl);
      }

      // User-Agent를 더 다양하게 랜덤 선택
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      ];

      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)] || userAgents[0];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(encodedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'image/webp,image/apng,image/jpeg,image/png,image/gif,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
          'Referer': 'https://www.google.com/',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const validImageTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'
      ];

      // Content-Type이 HTML/텍스트인 경우 즉시 실패
      if (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('application/json')) {
        throw new Error(`이미지가 아닌 콘텐츠입니다: ${contentType}`);
      }

      // Content-Type이 비어있거나 올바른 이미지 타입이 아닌 경우
      if (contentType && !validImageTypes.some(type => contentType.includes(type))) {
        // 하지만 일단 데이터를 받아보고 실제 이미지인지 확인
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 이미지 매직 넘버로 실제 이미지인지 확인
        if (!isValidImageBuffer(buffer)) {
          throw new Error(`올바른 이미지 형식이 아닙니다: ${contentType}`);
        }

        console.log(`Content-Type이 올바르지 않지만 실제 이미지임: ${contentType}`);
        return buffer;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error('빈 파일입니다');
      }

      // 이미지 매직 넘버 확인
      if (!isValidImageBuffer(buffer)) {
        throw new Error('이미지 파일 형식이 올바르지 않습니다');
      }

      console.log(`이미지 fetch 성공: ${buffer.length} bytes (${contentType})`);
      return buffer;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('알 수 없는 오류');
      console.warn(`이미지 fetch 실패 (시도 ${attempt + 1}/${retryCount}):`, lastError.message);

      // 재시도하기 전 잠시 대기
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(`이미지 로드 실패 (${retryCount}회 시도): ${lastError?.message}`);
};

const isValidImageBuffer = (buffer: Buffer): boolean => {
  if (buffer.length < 8) return false;

  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

  // GIF
  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') return true;

  // WebP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;

  // BMP
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) return true;

  // TIFF
  if ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A && buffer[3] === 0x00) ||
      (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x00 && buffer[3] === 0x2A)) return true;

  return false;
};
