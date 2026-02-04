export interface Metadata {
  mapQueries: string[];
  phone: string;
  url: string;
  lib_url: string[];
}

const emptyMetadata = (): Metadata => ({ mapQueries: [], phone: '', url: '', lib_url: [] });

/**
 * "지도,번호,링크.txt" 형식 파싱 (서리펫_글밥용)
 *
 * 플레이스 지도 : 강남역 맛집, 홍대 카페
 * 번호 : 010-1234-5678
 * https://blog.naver.com/xxx
 */
export const parsePetMetadata = (content: string): Metadata => {
  const meta = emptyMetadata();
  const lines = content.split('\n').map((l) => l.trim());

  for (const line of lines) {
    const mapMatch = line.match(/플레이스\s*지도\s*:\s*(.+)/);
    if (mapMatch) {
      meta.mapQueries.push(
        ...mapMatch[1]!.split(',').map((s) => s.trim()).filter(Boolean),
      );
    }

    const phoneMatch = line.match(/번호\s*:\s*(.+)/);
    if (phoneMatch) {
      meta.phone = phoneMatch[1]!.trim();
    }

    if (line.startsWith('https://') || line.startsWith('http://')) {
      meta.url = line;
    }
  }

  return meta;
};

/**
 * "발행 전 필독 사항.txt" 형식 파싱 (안과_입력용)
 *
 * ... 링크 삽입 영역 ...
 * https://example.com
 * ...
 * 지도 추가 [강남역 병원]
 */
export const parseInputMetadata = (content: string): Metadata => {
  const meta = emptyMetadata();
  const lines = content.split('\n').map((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('https://') || line.startsWith('http://')) {
      const prevLine = lines[i - 1] || '';
      if (prevLine.includes('링크') && prevLine.includes('삽입')) {
        meta.lib_url.push(line);
      }
    }

    const mapMatch = line.match(/지도\s*추가\s*\[(.+)\]/);
    if (mapMatch) {
      meta.mapQueries.push(mapMatch[1]!);
    }
  }

  return meta;
};

export const extractBlogId = (folderName: string): string => {
  const parts = folderName.split('_');
  return parts[parts.length - 1]!;
};

export const extractKeyword = (folderName: string): string => {
  const withoutNumber = folderName.replace(/^\d+\./, '');
  const parts = withoutNumber.split('_');
  return parts[0]!.trim();
};
