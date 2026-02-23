import * as fs from 'fs';
import * as path from 'path';
import { listSubdirectories } from './lib/local-fs';

type InputType = 'pet' | 'eye';

const normalizeType = (raw: string): InputType | null => {
  const v = raw.trim().toLowerCase();
  if (v === 'pet' || v === '애견') return 'pet';
  if (v === 'eye' || v === '안과') return 'eye';
  return null;
};

const shuffleInPlace = <T>(arr: T[]): void => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
};

const categorizeEyeKeyword = (keyword: string): string => {
  const k = keyword.replace(/\s+/g, '');

  if (k.includes('스마일')) return '스마일라식정보';
  if (k.includes('렌즈') || k.includes('삽입')) return '렌즈삽입술정보';
  if (k.includes('라식') || k.includes('라섹')) return '라식라섹정보';
  return '시력교정정보';
};

const PET_INFO_TOKENS = ['분양', '무료분양', '입양', '유기', '보호', '센터', '조건', '펫샵', '파양'] as const;
const PET_CAT_TOKENS = [
  '고양이',
  '코리안숏헤어',
  '숏헤어',
  '브리티쉬',
  '스코티시',
  '폴드',
  '렉돌',
  '랙돌',
  '러시안블루',
  '앙고라',
  '샴',
  '아비시니안',
  '먼치킨',
  '페르시안',
  '스핑크스',
  '쇼트헤어',
  '뱅갈',
  '친칠라',
  '터키시',
] as const;

const categorizePetKeyword = (keyword: string): string => {
  const k = keyword.replace(/\s+/g, '');
  const isInfo = PET_INFO_TOKENS.some((t) => k.includes(t));
  const isCat = PET_CAT_TOKENS.some((t) => k.includes(t));

  if (isInfo) return isCat ? '고양이분양정보' : '강아지분양정보';
  return isCat ? '고양이품종' : '강아지품종';
};

const resolveDefaultOutputDir = (type: InputType): string => {
  const base = process.cwd();
  if (type === 'pet') return path.join(base, '_samples', 'output', '애견_출력');
  return path.join(base, '_samples', 'output', '안과_출력');
};

const main = async (): Promise<void> => {
  const rawArgs = process.argv.slice(2);
  const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
  const [rawType, rawOutDir] = args;
  if (!rawType) {
    console.log(
      'Usage: pnpm -s scripts:build && node dist-scripts/generate-keyword-category-txt.js <애견|안과|pet|eye> [outputDir]',
    );
    process.exit(1);
  }

  const type = normalizeType(rawType);
  if (!type) {
    console.log('type must be one of: 애견 | 안과 | pet | eye');
    process.exit(1);
  }

  const outputDir = rawOutDir ? path.resolve(rawOutDir) : resolveDefaultOutputDir(type);
  if (!fs.existsSync(outputDir)) {
    console.error(`outputDir not found: ${outputDir}`);
    process.exit(1);
  }

  const blogs = listSubdirectories(outputDir);
  const lines: string[] = [];

  for (const blog of blogs) {
    const blogDir = path.join(outputDir, blog);
    const keywords = listSubdirectories(blogDir).filter((k) => !k.startsWith('_used_'));
    shuffleInPlace(keywords);

    lines.push(blog);
    for (const keyword of keywords) {
      const category = type === 'pet' ? categorizePetKeyword(keyword) : categorizeEyeKeyword(keyword);
      lines.push(`${keyword}:${category}`);
    }
    lines.push('');
  }

  const outPath = path.join(outputDir, '키워드_카테고리.txt');
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(`wrote: ${outPath} (blogs: ${blogs.length})`);
};

const handleError = (err: unknown): void => {
  console.error(err);
  process.exit(1);
};

main().catch(handleError);
